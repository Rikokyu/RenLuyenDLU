package service

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"gorm.io/gorm"
)

const defaultPassword = "DLU@2026"

var (
	ErrInvalidCredentials  = errors.New("tên đăng nhập hoặc mật khẩu không đúng")
	ErrInvalidGoogleUser   = errors.New("chỉ chấp nhận tài khoản Google @dlu.edu.vn")
	ErrGoogleNotConfigured = errors.New("Google OAuth chưa được cấu hình")
	ErrInvalidPassword     = errors.New("mật khẩu hiện tại không đúng")
	ErrWeakPassword        = errors.New("mật khẩu mới phải có ít nhất 8 ký tự")
	ErrSamePassword        = errors.New("mật khẩu mới phải khác mật khẩu hiện tại")
)

type AuthUser struct {
	ID          int64    `json:"id" gorm:"column:id"`
	Name        string   `json:"name" gorm:"column:name"`
	Username    string   `json:"username" gorm:"column:username"`
	Email       string   `json:"email" gorm:"column:email"`
	Role        string   `json:"role" gorm:"column:role"`
	RoleLabel   string   `json:"roleLabel" gorm:"column:role_label"`
	Subtitle    string   `json:"subtitle" gorm:"column:subtitle"`
	StudentID   string   `json:"studentId" gorm:"column:student_id"`
	ClassCode   string   `json:"classCode" gorm:"column:class_code"`
	Faculty     string   `json:"faculty" gorm:"column:faculty"`
	Position    string   `json:"position" gorm:"column:position"`
	Permissions []string `json:"permissions" gorm:"-"`
}

type AuthResult struct {
	Token string   `json:"token"`
	User  AuthUser `json:"user"`
}

type tokenClaims struct {
	UserID int64  `json:"sub"`
	Role   string `json:"role"`
	Expiry int64  `json:"exp"`
}

type authService struct {
	db             *gorm.DB
	jwtSecret      []byte
	jwtExpireHours int
	googleClientID string
}

func NewAuthService(db *gorm.DB, jwtSecret string, jwtExpireHours int, googleClientID string) AuthService {
	return &authService{
		db:             db,
		jwtSecret:      []byte(jwtSecret),
		jwtExpireHours: jwtExpireHours,
		googleClientID: googleClientID,
	}
}

type AuthService interface {
	Login(context.Context, string, string) (AuthResult, error)
	LoginWithGoogle(context.Context, string) (AuthResult, error)
	ChangePassword(context.Context, int64, string, string) error
	GetProfile(context.Context, int64) (Profile, error)
	ValidateToken(string) (int64, string, error)
}

func (s *authService) Login(ctx context.Context, username, password string) (AuthResult, error) {
	username = strings.TrimSpace(username)
	if username == "" || password == "" {
		return AuthResult{}, ErrInvalidCredentials
	}

	var user AuthUser
	err := s.userQuery(ctx).
		Where(`(
			(s.student_code IS NOT NULL AND s.student_code = ?)
			OR lower(split_part(u.email, '@', 1)) = lower(?)
		)`, username, username).
		Where(`u.password = crypt(?, u.password)`, password).
		Where(`COALESCE(u.status, 1) <> 0`).
		Limit(1).
		Scan(&user).Error
	if err != nil {
		return AuthResult{}, err
	}
	if user.ID == 0 {
		return AuthResult{}, ErrInvalidCredentials
	}
	user.Permissions = permissionsForRole(user.Role)
	return s.result(user)
}

func (s *authService) LoginWithGoogle(ctx context.Context, credential string) (AuthResult, error) {
	if s.googleClientID == "" {
		return AuthResult{}, ErrGoogleNotConfigured
	}
	if credential == "" {
		return AuthResult{}, ErrInvalidGoogleUser
	}

	var googleClaims struct {
		Email         string `json:"email"`
		EmailVerified string `json:"email_verified"`
		Audience      string `json:"aud"`
	}
	request, err := http.NewRequestWithContext(ctx, http.MethodGet,
		"https://oauth2.googleapis.com/tokeninfo?id_token="+url.QueryEscape(credential), nil)
	if err != nil {
		return AuthResult{}, err
	}
	client := &http.Client{Timeout: 5 * time.Second}
	response, err := client.Do(request)
	if err != nil {
		return AuthResult{}, fmt.Errorf("không thể xác minh Google token: %w", err)
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return AuthResult{}, ErrInvalidGoogleUser
	}
	if err := json.NewDecoder(response.Body).Decode(&googleClaims); err != nil {
		return AuthResult{}, fmt.Errorf("phản hồi xác minh Google không hợp lệ: %w", err)
	}
	email := strings.ToLower(strings.TrimSpace(googleClaims.Email))
	if googleClaims.Audience != s.googleClientID ||
		googleClaims.EmailVerified != "true" ||
		!strings.HasSuffix(email, "@dlu.edu.vn") {
		return AuthResult{}, ErrInvalidGoogleUser
	}

	var user AuthUser
	err = s.userQuery(ctx).
		Where(`lower(u.email) = ?`, email).
		Where(`COALESCE(u.status, 1) <> 0`).
		Limit(1).
		Scan(&user).Error
	if err != nil {
		return AuthResult{}, err
	}
	if user.ID == 0 {
		return AuthResult{}, ErrInvalidGoogleUser
	}
	user.Permissions = permissionsForRole(user.Role)
	return s.result(user)
}

func (s *authService) ChangePassword(ctx context.Context, userID int64, oldPassword, newPassword string) error {
	if oldPassword == "" || len(newPassword) < 8 {
		return ErrWeakPassword
	}
	if oldPassword == newPassword {
		return ErrSamePassword
	}
	result := s.db.WithContext(ctx).Exec(`
		UPDATE "User"
		SET password = crypt(?, gen_salt('bf', 10)), password_changed = TRUE
		WHERE id = ? AND password = crypt(?, password) AND COALESCE(status, 1) <> 0
	`, newPassword, userID, oldPassword)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrInvalidPassword
	}
	return nil
}

func (s *authService) userQuery(ctx context.Context) *gorm.DB {
	return s.db.WithContext(ctx).Table(`"User" u`).Select(`
		u.id,
		CONCAT_WS(' ', u.firstname, u.lastname) AS name,
		COALESCE(s.student_code, split_part(u.email, '@', 1)) AS username,
		u.email,
		CASE
			WHEN u.idrole = 1 THEN 'ADMIN'
			WHEN u.idrole = 2 THEN 'STUDENT_AFFAIRS_ASSISTANT'
			WHEN u.idrole = 3 AND lecturer.iduser IS NOT NULL THEN 'HOMEROOM_TEACHER'
			WHEN u.idrole = 3 AND user_position.name IS NOT NULL THEN 'CLASS_OFFICER'
			WHEN u.idrole = 3 THEN 'HOMEROOM_TEACHER'
			ELSE 'STUDENT'
		END AS role,
		COALESCE(s.student_code, '') AS student_id,
		COALESCE(student_class.class_code, teacher_class.class_code, '') AS class_code,
		COALESCE(
			NULLIF(u.responsiblefaculty, ''),
			student_faculty.name,
			teacher_faculty.name,
			''
		) AS faculty,
		COALESCE(user_position.name, '') AS position,
		CASE
			WHEN u.idrole = 1 THEN 'Admin'
			WHEN u.idrole = 2 THEN 'Trợ lý công tác sinh viên'
			WHEN u.idrole = 3 AND lecturer.iduser IS NOT NULL THEN 'Giảng viên'
			WHEN u.idrole = 3 AND user_position.name IS NOT NULL THEN user_position.name
			ELSE 'Sinh viên'
		END AS role_label,
		CASE
			WHEN u.idrole = 1 THEN 'Admin'
			WHEN u.idrole = 2 THEN CONCAT('Trợ lý công tác sinh viên - ', COALESCE(NULLIF(u.responsiblefaculty, ''), teacher_faculty.name, 'Chưa phân khoa'))
			WHEN u.idrole = 3 AND lecturer.iduser IS NOT NULL THEN CONCAT('Giảng viên - ', COALESCE(teacher_class.class_code, 'Chưa phân lớp'))
			WHEN u.idrole = 3 AND user_position.name IS NOT NULL THEN CONCAT(user_position.name, ' - ', COALESCE(student_class.class_code, student_faculty.name, ''))
			ELSE CONCAT(COALESCE(s.student_code, ''), ' - ', COALESCE(student_class.class_code, ''))
		END AS subtitle
	`).
		Joins(`LEFT JOIN student s ON s.iduser = u.id`).
		Joins(`LEFT JOIN class student_class ON student_class.id = s.idclass`).
		Joins(`LEFT JOIN major student_major ON student_major.id = student_class.idmajor`).
		Joins(`LEFT JOIN faculty student_faculty ON student_faculty.id = student_major.idfaculty`).
		Joins(`LEFT JOIN lecturer ON lecturer.iduser = u.id`).
		Joins(`LEFT JOIN faculty teacher_faculty ON teacher_faculty.id = lecturer.idfaculty`).
		Joins(`
			LEFT JOIN LATERAL (
				SELECT c.class_code
				FROM class c
				WHERE c.idlecturer = lecturer.id
				ORDER BY c.class_code
				LIMIT 1
			) teacher_class ON TRUE
		`).
		Joins(`
			LEFT JOIN LATERAL (
				SELECT p.name
				FROM user_post up
				JOIN post p ON p.id = up.idpost
				WHERE up.iduser = u.id AND p.status = 1
				ORDER BY CASE WHEN lower(p.name) = 'lớp trưởng' THEN 0 ELSE 1 END, p.id
				LIMIT 1
			) user_position ON TRUE
		`)
}

func (s *authService) result(user AuthUser) (AuthResult, error) {
	token, err := s.issueToken(user.ID, user.Role)
	if err != nil {
		return AuthResult{}, err
	}
	return AuthResult{Token: token, User: user}, nil
}

func permissionsForRole(role string) []string {
	switch role {
	case "ADMIN":
		return []string{"*"}
	case "STUDENT_AFFAIRS_ASSISTANT":
		return []string{"DASHBOARD", "ACTIVITY_VIEW", "ACTIVITY_MANAGE", "EVIDENCE_REVIEW", "REPORT_VIEW", "MANAGER"}
	case "HOMEROOM_TEACHER":
		return []string{"DASHBOARD", "ACTIVITY_VIEW", "EVIDENCE_VIEW", "REPORT_VIEW"}
	case "CLASS_OFFICER":
		return []string{"DASHBOARD", "ACTIVITY_VIEW", "EVIDENCE_VIEW", "REPORT_VIEW"}
	default:
		return []string{"DASHBOARD", "ACTIVITY_VIEW", "EVIDENCE_SELF"}
	}
}

func (s *authService) issueToken(userID int64, role string) (string, error) {
	expiry := time.Now().Add(time.Duration(s.jwtExpireHours) * time.Hour).Unix()
	payload, err := json.Marshal(tokenClaims{UserID: userID, Role: role, Expiry: expiry})
	if err != nil {
		return "", err
	}
	body := base64.RawURLEncoding.EncodeToString(payload)
	signature := s.sign(body)
	return body + "." + signature, nil
}

func (s *authService) ValidateToken(token string) (int64, string, error) {
	parts := strings.Split(token, ".")
	if len(parts) != 2 || !hmac.Equal([]byte(parts[1]), []byte(s.sign(parts[0]))) {
		return 0, "", errors.New("token không hợp lệ")
	}
	payload, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return 0, "", errors.New("token không hợp lệ")
	}
	var claims tokenClaims
	if err := json.Unmarshal(payload, &claims); err != nil || claims.UserID == 0 || claims.Expiry <= time.Now().Unix() {
		return 0, "", errors.New("token hết hạn hoặc không hợp lệ")
	}
	return claims.UserID, claims.Role, nil
}

func (s *authService) sign(value string) string {
	mac := hmac.New(sha256.New, s.jwtSecret)
	_, _ = mac.Write([]byte(value))
	return base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
}
