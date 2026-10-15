package service

import (
	"context"
	"fmt"
	"strings"
	"time"

	"renluyen-dlu-backend/internal/dto"

	"gorm.io/gorm"
)

type Profile struct {
	User          AuthUser          `json:"user"`
	TrainingScore int               `json:"trainingScore"`
	TrainingRank  string            `json:"trainingRank"`
	Activities    []ProfileActivity `json:"activities"`
}

type ProfileActivity struct {
	ActivityID         int64  `json:"activityId" gorm:"column:activity_id"`
	ActivityCode       string `json:"activityCode" gorm:"column:activity_code"`
	Title              string `json:"title" gorm:"column:title"`
	Category           string `json:"category" gorm:"column:category"`
	Registered         string `json:"registeredAt" gorm:"column:registered_at"`
	TimeBegin          string `json:"timeBegin" gorm:"column:time_begin"`
	TimeEnd            string `json:"timeEnd" gorm:"column:time_end"`
	Score              int    `json:"score" gorm:"column:score"`
	Evidence           string `json:"evidenceStatus" gorm:"column:evidence_status"`
	RegistrationStatus string `json:"registrationStatus" gorm:"column:registration_status"`
}

func (s *authService) GetProfile(ctx context.Context, userID int64) (Profile, error) {
	var user AuthUser
	if err := s.userQuery(ctx).Where(`u.id = ?`, userID).Limit(1).Scan(&user).Error; err != nil {
		return Profile{}, err
	}
	if user.ID == 0 {
		return Profile{}, fmt.Errorf("không tìm thấy hồ sơ người dùng")
	}
	user.Permissions = permissionsForRole(user.Role)
	var accountDetails struct {
		FirstName  string `gorm:"column:first_name"`
		LastName   string `gorm:"column:last_name"`
		Gender     string `gorm:"column:gender"`
		BirthDay   string `gorm:"column:birth_day"`
		BirthPlace string `gorm:"column:birth_place"`
		Phone      string `gorm:"column:phone"`
	}
	if err := s.db.WithContext(ctx).Table(`"User"`).
		Select(`firstname AS first_name, lastname AS last_name, gender, dob::text AS birth_day, COALESCE(birthplace, '') AS birth_place, phone`).
		Where(`id = ?`, userID).
		Scan(&accountDetails).Error; err != nil {
		return Profile{}, err
	}
	user.FirstName = accountDetails.FirstName
	user.LastName = accountDetails.LastName
	user.Gender = accountDetails.Gender
	user.BirthDay = accountDetails.BirthDay
	user.BirthPlace = accountDetails.BirthPlace
	user.Phone = accountDetails.Phone

	profile := Profile{
		User:       user,
		Activities: []ProfileActivity{},
	}
	if user.StudentID == "" {
		return profile, nil
	}

	if err := s.db.WithContext(ctx).Raw(`
		SELECT COALESCE(tp.lastscore, 0)
		FROM student s
		LEFT JOIN trainingpoint tp ON tp.idstudent = s.id
		LEFT JOIN school_year sy ON sy.id = tp.idyear
		WHERE s.iduser = ?
		ORDER BY sy.year DESC NULLS LAST, sy.semester DESC NULLS LAST, tp.id DESC NULLS LAST
		LIMIT 1
	`, userID).Scan(&profile.TrainingScore).Error; err != nil {
		return Profile{}, err
	}
	switch {
	case profile.TrainingScore >= 90:
		profile.TrainingRank = "Xuất sắc"
	case profile.TrainingScore >= 80:
		profile.TrainingRank = "Tốt"
	case profile.TrainingScore >= 65:
		profile.TrainingRank = "Khá"
	case profile.TrainingScore >= 50:
		profile.TrainingRank = "Trung bình"
	default:
		profile.TrainingRank = "Chưa có điểm"
	}

	err := s.db.WithContext(ctx).Raw(`
		SELECT
			a.id AS activity_id,
			a.activity_code AS activity_code,
			a.title,
			COALESCE(a.detail, '') AS category,
			to_char(ar.registeredat, 'DD/MM/YYYY HH24:MI') AS registered_at,
			a.timebegin AS time_begin,
			a.timeend AS time_end,
			COALESCE(a.score, 0) AS score,
			CASE
				WHEN e.status = 1 THEN 'Đã duyệt'
				WHEN e.status = 2 THEN 'Đã từ chối'
				WHEN e.id IS NOT NULL THEN 'Chờ duyệt'
				ELSE 'Chưa nộp'
			END AS evidence_status,
			CASE WHEN ar.status = 1 THEN 'Đã đăng ký' ELSE 'Đã hủy đăng ký' END AS registration_status
		FROM student s
		JOIN activity_registration ar ON ar.idstudent = s.id
		JOIN activity a ON a.id = ar.idactivity
		LEFT JOIN LATERAL (
			SELECT e.status, e.id
			FROM evidence e
			WHERE e.idacregis = ar.id
			ORDER BY e.id DESC
			LIMIT 1
		) e ON TRUE
		WHERE s.iduser = ?
		ORDER BY ar.registeredat DESC
	`, userID).Scan(&profile.Activities).Error
	if profile.Activities == nil {
		profile.Activities = []ProfileActivity{}
	}
	return profile, err
}

func (s *authService) UpdateProfile(
	ctx context.Context,
	userID int64,
	input dto.ProfileMutation,
) (Profile, error) {
	input.FirstName = strings.TrimSpace(input.FirstName)
	input.LastName = strings.TrimSpace(input.LastName)
	input.Gender = strings.TrimSpace(input.Gender)
	input.BirthDay = strings.TrimSpace(input.BirthDay)
	input.BirthPlace = strings.TrimSpace(input.BirthPlace)
	input.Phone = strings.TrimSpace(input.Phone)
	birthDay, err := time.Parse("2006-01-02", input.BirthDay)
	validGender := input.Gender == "Nam" || input.Gender == "Nữ" || input.Gender == "Khác"
	if userID <= 0 || input.FirstName == "" || input.LastName == "" ||
		!validGender || input.Phone == "" || err != nil ||
		birthDay.After(time.Now()) {
		return Profile{}, ErrInvalidProfile
	}

	result := s.db.WithContext(ctx).Exec(`
		UPDATE "User"
		SET firstname = ?, lastname = ?, gender = ?, dob = ?::date, birthplace = ?, phone = ?
		WHERE id = ? AND COALESCE(status, 1) <> 0
	`, input.FirstName, input.LastName, input.Gender, birthDay.Format("2006-01-02"),
		input.BirthPlace, input.Phone, userID)
	if result.Error != nil {
		return Profile{}, result.Error
	}
	if result.RowsAffected == 0 {
		return Profile{}, gorm.ErrRecordNotFound
	}
	profile, err := s.GetProfile(ctx, userID)
	if err != nil {
		return Profile{}, fmt.Errorf("reload updated profile: %w", err)
	}
	return profile, nil
}
