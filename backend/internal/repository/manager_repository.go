package repository

import (
	"context"
	"errors"
	"strconv"
	"strings"

	"renluyen-dlu-backend/internal/dto"

	"gorm.io/gorm"
)

type ManagerRepository interface {
	GetStudents(ctx context.Context, search, classCode string) ([]dto.ManagerStudent, error)
	GetClasses(ctx context.Context) ([]dto.ManagerClass, error)
	GetAccounts(ctx context.Context) ([]dto.ManagerAccount, error)
	GetRoles(ctx context.Context) ([]dto.ManagerRole, error)
	GetAccountResetSeed(ctx context.Context, id int64) (string, error)
	ResetAccountPassword(ctx context.Context, id int64, passwordHash string) error
	UpsertAccount(ctx context.Context, id int64, account dto.ManagerAccountMutation, passwordHash string) error
	DeleteAccount(ctx context.Context, id int64) error
	UpsertClass(ctx context.Context, oldCode string, class dto.ManagerClassMutation) error
	DeleteClass(ctx context.Context, code string) error
	UpsertStudent(ctx context.Context, oldID string, student dto.ManagerStudentMutation, passwordHash string) error
	DeleteStudent(ctx context.Context, id string) error
}

type managerRepository struct {
	db *gorm.DB
}

func NewManagerRepository(db *gorm.DB) ManagerRepository {
	return &managerRepository{
		db: db,
	}
}

func (r *managerRepository) GetStudents(
	ctx context.Context,
	search string,
	classCode string,
) ([]dto.ManagerStudent, error) {

	var students []dto.ManagerStudent

	query := r.db.WithContext(ctx).
		Table(`"User" u`).
		Select(`
			COALESCE(s.student_code, '') AS id,
			COALESCE(s.student_code, '') AS mssv,
			COALESCE(NULLIF(CONCAT_WS(' ', u.firstname, u.lastname), ''), '') AS name,
			COALESCE(u.firstname, '') AS first_name,
			COALESCE(u.lastname, '') AS last_name,
			COALESCE(c.class_code, '') AS class_code,
			COALESCE(c.class_code, '') AS class_name,
			COALESCE(f.name, '') AS faculty_name,
			COALESCE(m.major_code, '') AS study_program_id,
			COALESCE(u.gender, '') AS gender,
			COALESCE(u.dob::text, '') AS birth_day,
			COALESCE(u.birthplace, '') AS birth_place,
			COALESCE(u.phone, '') AS phone,
			COALESCE(u.email, '') AS email,
			'' AS hometown_country,
			'' AS hometown_province,
			'' AS hometown_city,
			'' AS hometown_address,
			(COALESCE(c.status, 0) = 1) AS is_in_class,
			COALESCE((
				SELECT CASE
					WHEN lower(p.name) = 'lớp trưởng' THEN 1
					WHEN lower(p.name) = 'bí thư lớp' THEN 2
					ELSE 0
				END
				FROM user_post up
				JOIN post p ON p.id = up.idpost
				WHERE up.iduser = u.id
				AND lower(p.name) IN ('lớp trưởng', 'bí thư lớp')
				ORDER BY CASE
					WHEN lower(p.name) = 'lớp trưởng' THEN 1
					ELSE 2
				END
				LIMIT 1
			), 0) AS class_role_id,
			'' AS permanent_residence
		`).
		Joins(`LEFT JOIN student s ON s.iduser = u.id`).
		Joins(`LEFT JOIN class c ON c.id = s.idclass`).
		Joins(`LEFT JOIN major m ON m.id = c.idmajor`).
		Joins(`LEFT JOIN faculty f ON f.id = m.idfaculty`).
		Where(`s.id IS NOT NULL`).
		Where(`COALESCE(u.status, 1) <> 0`)

	if search != "" {
		pattern := "%" + search + "%"

		query = query.Where(`
			s.student_code ILIKE ?
			OR CONCAT_WS(' ', u.firstname, u.lastname) ILIKE ?
			OR c.class_code ILIKE ?
			OR COALESCE(m.major_code, '') ILIKE ?
		`,
			pattern,
			pattern,
			pattern,
			pattern,
		)
	}

	if classCode != "" {
		query = query.Where(`c.class_code = ?`, classCode)
	}

	err := query.
		Order(`u.id ASC`).
		Scan(&students).
		Error

	return students, err
}

func (r *managerRepository) GetClasses(ctx context.Context) ([]dto.ManagerClass, error) {
	var classes []dto.ManagerClass
	err := r.db.WithContext(ctx).
		Table(`class c`).
		Select(`
			c.class_code AS code,
			COALESCE(f.name, '') AS faculty,
			COALESCE(sy.year, '') AS academic_year,
			COUNT(DISTINCT CASE WHEN COALESCE(u.status, 1) <> 0 THEN s.id END) AS student_count
		`).
		Joins(`LEFT JOIN major m ON m.id = c.idmajor`).
		Joins(`LEFT JOIN faculty f ON f.id = m.idfaculty`).
		Joins(`LEFT JOIN student s ON s.idclass = c.id`).
		Joins(`LEFT JOIN "User" u ON u.id = s.iduser`).
		Joins(`
			LEFT JOIN LATERAL (
				SELECT sy.year
				FROM class_year cy
				JOIN school_year sy ON sy.id = cy.idyear
				WHERE cy.idclass = c.id AND cy.status = 1
				ORDER BY sy.year DESC, sy.semester DESC
				LIMIT 1
			) sy ON TRUE
		`).
		Where(`c.status = 1`).
		Group(`c.id, c.class_code, f.name, sy.year`).
		Order(`c.class_code ASC`).
		Scan(&classes).Error
	return classes, err
}

func (r *managerRepository) GetAccounts(ctx context.Context) ([]dto.ManagerAccount, error) {
	var accounts []dto.ManagerAccount
	err := r.db.WithContext(ctx).
		Table(`"User" u`).
		Select(`
			u.id,
			CONCAT_WS(' ', u.firstname, u.lastname) AS name,
			u.email AS username,
			u.email,
			u.gender,
			COALESCE(u.dob::text, '') AS birth_day,
			u.phone,
			CASE
				WHEN lower(r.name) IN ('admin', 'quản trị viên') THEN 'Admin'
				WHEN lower(r.name) LIKE 'trợ lý%' THEN 'Trợ lý công tác sinh viên'
				WHEN EXISTS (
					SELECT 1
					FROM user_post officer_up
					JOIN post officer_post ON officer_post.id = officer_up.idpost
					WHERE officer_up.iduser = u.id
						AND officer_post.status = 1
						AND lower(officer_post.name) IN ('giảng viên chủ nhiệm', 'lớp trưởng', 'bí thư lớp', 'bí thư khoa')
				) THEN 'Giảng viên chủ nhiệm / Ban cán sự'
				WHEN lower(r.name) LIKE '%sinh viên%' OR lower(r.name) = 'student'
					OR (s.id IS NOT NULL AND l.iduser IS NULL) THEN 'Sinh viên'
				WHEN lower(r.name) LIKE '%chủ nhiệm%' OR lower(r.name) LIKE '%cán sự%'
					OR lower(r.name) LIKE '%lecturer%' OR l.iduser IS NOT NULL
					THEN 'Giảng viên chủ nhiệm / Ban cán sự'
				WHEN r.id = 1 THEN 'Admin'
				WHEN r.id = 2 THEN 'Trợ lý công tác sinh viên'
				WHEN r.id = 3 THEN 'Giảng viên chủ nhiệm / Ban cán sự'
				ELSE 'Sinh viên'
			END AS role,
			CASE
				WHEN lower(r.name) IN ('admin', 'quản trị viên') THEN 'ADMIN'
				WHEN lower(r.name) LIKE 'trợ lý%' THEN 'STUDENT_AFFAIRS_ASSISTANT'
				WHEN EXISTS (
					SELECT 1
					FROM user_post officer_up
					JOIN post officer_post ON officer_post.id = officer_up.idpost
					WHERE officer_up.iduser = u.id
						AND officer_post.status = 1
						AND lower(officer_post.name) IN ('giảng viên chủ nhiệm', 'lớp trưởng', 'bí thư lớp', 'bí thư khoa')
				) THEN 'HOMEROOM_CLASS_OFFICER'
				WHEN lower(r.name) LIKE '%sinh viên%' OR lower(r.name) = 'student'
					OR (s.id IS NOT NULL AND l.iduser IS NULL) THEN 'STUDENT'
				WHEN lower(r.name) LIKE '%chủ nhiệm%' OR lower(r.name) LIKE '%cán sự%'
					OR lower(r.name) LIKE '%lecturer%' OR l.iduser IS NOT NULL
					THEN 'HOMEROOM_CLASS_OFFICER'
				WHEN r.id = 1 THEN 'ADMIN'
				WHEN r.id = 2 THEN 'STUDENT_AFFAIRS_ASSISTANT'
				WHEN r.id = 3 THEN 'HOMEROOM_CLASS_OFFICER'
				ELSE 'STUDENT'
			END AS role_code,
			COALESCE(NULLIF(u.responsiblefaculty, ''), sf.name, lf.name, '') AS unit,
			COALESCE(c.class_code, assigned_class.class_code, '') AS class_code,
			COALESCE(c.class_code, assigned_class.class_code, '') AS class_name,
			COALESCE(user_positions.names, '') AS position,
			COALESCE(s.student_code, '') AS student_id,
			CASE WHEN u.status <> 0 THEN 'Đang hoạt động' ELSE 'Đã khóa' END AS status,
			(u.status <> 0) AS active,
			'Chưa đăng nhập' AS last_login
		`).
		Joins(`JOIN role r ON r.id = u.idrole`).
		Joins(`LEFT JOIN student s ON s.iduser = u.id`).
		Joins(`LEFT JOIN class c ON c.id = s.idclass`).
		Joins(`LEFT JOIN major m ON m.id = c.idmajor`).
		Joins(`LEFT JOIN faculty sf ON sf.id = m.idfaculty`).
		Joins(`LEFT JOIN lecturer l ON l.iduser = u.id`).
		Joins(`LEFT JOIN faculty lf ON lf.id = l.idfaculty`).
		Joins(`
			LEFT JOIN LATERAL (
				SELECT c_assigned.class_code
				FROM class c_assigned
				WHERE c_assigned.idlecturer = l.id
				ORDER BY c_assigned.class_code ASC
				LIMIT 1
			) assigned_class ON TRUE
		`).
		Joins(`
			LEFT JOIN (
				SELECT up.iduser, STRING_AGG(DISTINCT p.name, ', ' ORDER BY p.name) AS names
				FROM user_post up
				JOIN post p ON p.id = up.idpost
				WHERE p.status = 1
				GROUP BY up.iduser
			) user_positions ON user_positions.iduser = u.id
		`).
		Order(`
			CASE
				WHEN lower(r.name) IN ('admin', 'quản trị viên') THEN 1
				WHEN lower(r.name) LIKE 'trợ lý%' THEN 2
				WHEN EXISTS (
					SELECT 1
					FROM user_post officer_up
					JOIN post officer_post ON officer_post.id = officer_up.idpost
					WHERE officer_up.iduser = u.id
						AND officer_post.status = 1
						AND lower(officer_post.name) IN ('lớp trưởng', 'bí thư lớp', 'bí thư khoa')
				) THEN 3
				WHEN lower(r.name) LIKE '%sinh viên%' OR lower(r.name) = 'student'
					OR (s.id IS NOT NULL AND l.iduser IS NULL) THEN 4
				WHEN lower(r.name) LIKE '%chủ nhiệm%' OR lower(r.name) LIKE '%cán sự%'
					OR lower(r.name) LIKE '%lecturer%' OR l.iduser IS NOT NULL THEN 3
				WHEN r.id = 1 THEN 1
				WHEN r.id = 2 THEN 2
				WHEN r.id = 3 THEN 3
				ELSE 4
			END
		`).
		Order(`u.id ASC`).
		Scan(&accounts).Error
	return accounts, err
}

func (r *managerRepository) GetAccountResetSeed(ctx context.Context, id int64) (string, error) {
	var seed string
	err := r.db.WithContext(ctx).
		Table(`"User" u`).
		Select(`COALESCE(NULLIF(s.student_code, ''), split_part(u.email, '@', 1))`).
		Joins(`LEFT JOIN student s ON s.iduser = u.id`).
		Where(`u.id = ?`, id).
		Scan(&seed).Error
	if err != nil {
		return "", err
	}
	if seed == "" {
		return "", gorm.ErrRecordNotFound
	}
	return seed, nil
}

func (r *managerRepository) ResetAccountPassword(ctx context.Context, id int64, passwordHash string) error {
	result := r.db.WithContext(ctx).
		Exec(`UPDATE "User" SET password = ?, password_changed = FALSE WHERE id = ?`, passwordHash, id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *managerRepository) GetRoles(ctx context.Context) ([]dto.ManagerRole, error) {
	var roles []dto.ManagerRole
	err := r.db.WithContext(ctx).
		Table(`role`).
		Select(`
			CASE
				WHEN lower(name) IN ('admin', 'quản trị viên') THEN 'ADMIN'
				WHEN lower(name) LIKE 'trợ lý%' THEN 'STUDENT_AFFAIRS_ASSISTANT'
				WHEN lower(name) LIKE '%chủ nhiệm%' OR lower(name) LIKE '%cán sự%'
					OR lower(name) LIKE '%lecturer%' THEN 'HOMEROOM_CLASS_OFFICER'
				WHEN lower(name) LIKE '%sinh viên%' OR lower(name) = 'student' THEN 'STUDENT'
				WHEN id = 1 THEN 'ADMIN'
				WHEN id = 2 THEN 'STUDENT_AFFAIRS_ASSISTANT'
				WHEN id = 3 THEN 'HOMEROOM_CLASS_OFFICER'
				ELSE 'STUDENT'
			END AS code,
			name
		`).
		Where(`status <> 0`).
		Order(`id ASC`).
		Scan(&roles).Error
	if err == nil {
		roles = uniqueManagerRoles(roles)
	}
	return roles, err
}

func uniqueManagerRoles(roles []dto.ManagerRole) []dto.ManagerRole {
	seen := make(map[string]bool, len(roles))
	result := make([]dto.ManagerRole, 0, len(roles))
	for _, role := range roles {
		if seen[role.Code] {
			continue
		}
		seen[role.Code] = true
		result = append(result, role)
	}
	return result
}

func (r *managerRepository) UpsertAccount(ctx context.Context, id int64, account dto.ManagerAccountMutation, passwordHash string) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		userID := id
		roleID, err := managerRoleID(tx, account.RoleCode)
		if err != nil {
			return err
		}

		firstName, lastName := splitUserName(account.Name)
		status := 0
		if account.Active {
			status = 1
		}

		if userID == 0 {
			if err := tx.Exec(`LOCK TABLE "User" IN EXCLUSIVE MODE`).Error; err != nil {
				return err
			}
			if err := tx.Raw(`SELECT COALESCE(MAX(id), 0) + 1 FROM "User"`).Scan(&userID).Error; err != nil {
				return err
			}
			if err := tx.Exec(`
				INSERT INTO "User" (id, firstname, lastname, gender, dob, birthplace, phone, email, password, status, idrole, responsiblefaculty)
				VALUES (?, ?, ?, ?, ?::date, '', ?, ?, ?, ?, ?, ?)
			`, userID, firstName, lastName, account.Gender, account.BirthDay, account.Phone, account.Email, passwordHash, status, roleID, account.Unit).Error; err != nil {
				return err
			}
		} else {
			result := tx.Exec(`
				UPDATE "User"
				SET firstname = ?, lastname = ?, gender = ?, dob = ?::date,
				    phone = ?, email = ?, password = CASE WHEN ? = '' THEN password ELSE ? END,
				    password_changed = CASE WHEN ? = '' THEN password_changed ELSE FALSE END,
				    idrole = ?, status = ?, responsiblefaculty = ?
				WHERE id = ?
			`, firstName, lastName, account.Gender, account.BirthDay, account.Phone, account.Email, passwordHash, passwordHash, passwordHash, roleID, status, account.Unit, userID)
			if result.Error != nil {
				return result.Error
			}
			if result.RowsAffected == 0 {
				return gorm.ErrRecordNotFound
			}
		}

		if account.Unit != "" {
			if err := syncManagerAccountUnit(tx, userID, account.Unit); err != nil {
				return err
			}
		}
		if account.RoleCode == "HOMEROOM_CLASS_OFFICER" {
			if err := syncManagerAccountClass(tx, userID, account.ClassCode); err != nil {
				return err
			}
			return syncManagerAccountPosition(tx, userID, account.Position)
		}
		if account.RoleCode == "STUDENT" {
			if err := clearManagerAccountClass(tx, userID); err != nil {
				return err
			}
			if err := syncManagerAccountPosition(tx, userID, ""); err != nil {
				return err
			}
			return tx.Exec(`DELETE FROM lecturer WHERE iduser = ?`, userID).Error
		}
		if account.ClassCode == "" {
			if err := clearManagerAccountClass(tx, userID); err != nil {
				return err
			}
			return syncManagerAccountPosition(tx, userID, "")
		}
		return nil
	})
}

func syncManagerAccountUnit(db *gorm.DB, userID int64, unit string) error {
	var studentCount int64
	if err := db.Table(`student`).Where(`iduser = ?`, userID).Count(&studentCount).Error; err != nil {
		return err
	}
	if studentCount > 0 {
		return nil
	}

	var facultyID int64
	if err := db.Table(`faculty`).
		Select(`id`).
		Where(`name = ? OR faculty_code = ?`, unit, unit).
		Limit(1).
		Scan(&facultyID).Error; err != nil {
		return err
	}
	if facultyID == 0 {
		if err := db.Table(`class c`).
			Select(`m.idfaculty`).
			Joins(`JOIN major m ON m.id = c.idmajor`).
			Where(`c.class_code = ?`, unit).
			Limit(1).
			Scan(&facultyID).Error; err != nil {
			return err
		}
	}
	if facultyID == 0 {
		return gorm.ErrRecordNotFound
	}
	if err := db.Exec(`LOCK TABLE lecturer IN EXCLUSIVE MODE`).Error; err != nil {
		return err
	}

	var lecturerID int64
	if err := db.Table(`lecturer`).
		Select(`id`).
		Where(`iduser = ?`, userID).
		Limit(1).
		Scan(&lecturerID).Error; err != nil {
		return err
	}
	if lecturerID != 0 {
		return db.Exec(`UPDATE lecturer SET idfaculty = ? WHERE id = ?`, facultyID, lecturerID).Error
	}
	if err := db.Raw(`SELECT COALESCE(MAX(id), 0) + 1 FROM lecturer`).Scan(&lecturerID).Error; err != nil {
		return err
	}
	return db.Exec(`
		INSERT INTO lecturer (id, lecturer_code, idfaculty, iduser)
		VALUES (?, ?, ?, ?)
	`, lecturerID, "MGR"+strconv.FormatInt(userID, 10), facultyID, userID).Error
}

func syncManagerAccountClass(db *gorm.DB, userID int64, classCode string) error {
	var studentClassCode string
	if err := db.Table(`student s`).
		Select(`c.class_code`).
		Joins(`JOIN class c ON c.id = s.idclass`).
		Where(`s.iduser = ?`, userID).
		Limit(1).
		Scan(&studentClassCode).Error; err != nil {
		return err
	}
	if studentClassCode != "" {
		if studentClassCode != classCode {
			return errors.New("lớp được chọn phải trùng với lớp sinh viên đang theo học")
		}
		return nil
	}

	var lecturerID int64
	if err := db.Table(`lecturer`).
		Select(`id`).
		Where(`iduser = ?`, userID).
		Limit(1).
		Scan(&lecturerID).Error; err != nil {
		return err
	}
	if lecturerID == 0 {
		if err := db.Exec(`LOCK TABLE lecturer IN EXCLUSIVE MODE`).Error; err != nil {
			return err
		}
		if err := db.Raw(`SELECT COALESCE(MAX(id), 0) + 1 FROM lecturer`).Scan(&lecturerID).Error; err != nil {
			return err
		}
		if err := db.Exec(`
			INSERT INTO lecturer (id, lecturer_code, idfaculty, iduser)
			VALUES (?, ?, NULL, ?)
		`, lecturerID, "MGR"+strconv.FormatInt(userID, 10), userID).Error; err != nil {
			return err
		}
	}

	var classID int64
	if err := db.Table(`class`).
		Select(`id`).
		Where(`class_code = ? AND status <> 0`, classCode).
		Limit(1).
		Scan(&classID).Error; err != nil {
		return err
	}
	if classID == 0 {
		return gorm.ErrRecordNotFound
	}
	var assignedLecturerID int64
	if err := db.Table(`class`).
		Select(`idlecturer`).
		Where(`id = ?`, classID).
		Scan(&assignedLecturerID).Error; err != nil {
		return err
	}
	if assignedLecturerID == lecturerID {
		return nil
	}
	if assignedLecturerID != 0 && assignedLecturerID != lecturerID {
		return errors.New("lớp đã được phân công giảng viên phụ trách")
	}
	if err := db.Exec(`UPDATE class SET idlecturer = NULL WHERE idlecturer = ?`, lecturerID).Error; err != nil {
		return err
	}
	return db.Exec(`UPDATE class SET idlecturer = ? WHERE id = ?`, lecturerID, classID).Error
}

func clearManagerAccountClass(db *gorm.DB, userID int64) error {
	var lecturerID int64
	if err := db.Table(`lecturer`).
		Select(`id`).
		Where(`iduser = ?`, userID).
		Limit(1).
		Scan(&lecturerID).Error; err != nil {
		return err
	}
	if lecturerID == 0 {
		return nil
	}
	return db.Exec(`UPDATE class SET idlecturer = NULL WHERE idlecturer = ?`, lecturerID).Error
}

func syncManagerAccountPosition(db *gorm.DB, userID int64, position string) error {
	var positionCondition string
	switch strings.ToLower(strings.TrimSpace(position)) {
	case "":
		positionCondition = ""
	case "giảng viên chủ nhiệm":
		positionCondition = `lower(name) = 'giảng viên chủ nhiệm'`
	case "lớp trưởng":
		positionCondition = `lower(name) = 'lớp trưởng'`
	case "bí thư lớp":
		positionCondition = `lower(name) = 'bí thư lớp'`
	case "bí thư khoa":
		positionCondition = `lower(name) = 'bí thư khoa'`
	default:
		var existingPositionCount int64
		if err := db.Table(`user_post up`).
			Joins(`JOIN post p ON p.id = up.idpost`).
			Where(`up.iduser = ? AND lower(p.name) = lower(?) AND p.status <> 0`, userID, position).
			Count(&existingPositionCount).Error; err != nil {
			return err
		}
		if existingPositionCount > 0 {
			return nil
		}
		return errors.New("chức vụ ban cán sự không hợp lệ")
	}

	if err := db.Exec(`
		DELETE FROM user_post
		WHERE iduser = ? AND idpost IN (
			SELECT id FROM post
			WHERE lower(name) IN ('giảng viên chủ nhiệm', 'lớp trưởng', 'bí thư lớp', 'bí thư khoa')
		)
	`, userID).Error; err != nil {
		return err
	}
	if positionCondition == "" {
		return nil
	}

	var postID int64
	if err := db.Table(`post`).
		Select(`id`).
		Where(`(` + positionCondition + `) AND status <> 0`).
		Order(`id ASC`).
		Limit(1).
		Scan(&postID).Error; err != nil {
		return err
	}
	if postID == 0 {
		return gorm.ErrRecordNotFound
	}
	return db.Exec(`
		INSERT INTO user_post (iduser, idpost)
		VALUES (?, ?)
		ON CONFLICT (iduser, idpost) DO NOTHING
	`, userID, postID).Error
}

func (r *managerRepository) DeleteAccount(ctx context.Context, id int64) error {
	result := r.db.WithContext(ctx).Exec(`UPDATE "User" SET status = 0 WHERE id = ? AND id <> 1`, id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func managerRoleID(db *gorm.DB, code string) (int64, error) {
	var roleNameCondition string
	switch code {
	case "ADMIN":
		roleNameCondition = `lower(name) IN ('admin', 'quản trị viên')`
	case "STUDENT_AFFAIRS_ASSISTANT":
		roleNameCondition = `lower(name) LIKE 'trợ lý%'`
	case "HOMEROOM_CLASS_OFFICER":
		roleNameCondition = `lower(name) LIKE '%chủ nhiệm%' OR lower(name) LIKE '%cán sự%' OR lower(name) LIKE '%lecturer%'`
	case "STUDENT":
		roleNameCondition = `lower(name) LIKE '%sinh viên%' OR lower(name) = 'student'`
	default:
		return 0, errors.New("vai trò không hợp lệ")
	}

	var id int64
	err := db.Table("role").
		Select("id").
		Where(roleNameCondition).
		Order("id ASC").
		Limit(1).
		Scan(&id).Error
	if err != nil {
		return 0, err
	}
	if id == 0 {
		return 0, errors.New("không tìm thấy vai trò trong cơ sở dữ liệu")
	}
	return id, nil
}

func splitUserName(name string) (string, string) {
	parts := strings.Fields(name)
	if len(parts) < 2 {
		return name, ""
	}
	return parts[0], strings.Join(parts[1:], " ")
}

func (r *managerRepository) UpsertClass(ctx context.Context, oldCode string, class dto.ManagerClassMutation) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Exec(`LOCK TABLE class, major, school_year, class_year IN EXCLUSIVE MODE`).Error; err != nil {
			return err
		}

		var facultyID *int64
		if class.Faculty != "" {
			var id int64
			err := tx.Table(`faculty`).
				Select(`id`).
				Where(`name = ? OR faculty_code = ?`, class.Faculty, class.Faculty).
				Order(`id ASC`).
				Limit(1).
				Scan(&id).Error
			if err != nil {
				return err
			}
			if id == 0 {
				return gorm.ErrRecordNotFound
			}
			facultyID = &id
		}

		var classID int64
		var existingMajorID *int64
		if oldCode != "" {
			var existingClass struct {
				ID      int64
				MajorID *int64 `gorm:"column:idmajor"`
			}
			if err := tx.Table(`class`).
				Select(`id, idmajor`).
				Where(`class_code = ?`, oldCode).
				Take(&existingClass).Error; err != nil {
				return err
			}
			classID = existingClass.ID
			existingMajorID = existingClass.MajorID
		} else {
			var existingID int64
			if err := tx.Table(`class`).Select(`id`).Where(`class_code = ?`, class.Code).Scan(&existingID).Error; err != nil {
				return err
			}
			if existingID != 0 {
				return gorm.ErrDuplicatedKey
			}
		}
		if oldCode != "" && class.Code != oldCode {
			var duplicateCount int64
			if err := tx.Table(`class`).
				Where(`class_code = ? AND id <> ?`, class.Code, classID).
				Count(&duplicateCount).Error; err != nil {
				return err
			}
			if duplicateCount > 0 {
				return gorm.ErrDuplicatedKey
			}
		}

		var majorID *int64
		if facultyID != nil {
			var id int64
			if existingMajorID != nil {
				err := tx.Table(`major`).
					Select(`id`).
					Where(`id = ? AND idfaculty = ?`, *existingMajorID, *facultyID).
					Scan(&id).Error
				if err != nil {
					return err
				}
			}
			if id == 0 {
				err := tx.Table(`major`).
					Select(`id`).
					Where(`idfaculty = ?`, *facultyID).
					Order(`id ASC`).
					Limit(1).
					Scan(&id).Error
				if err != nil {
					return err
				}
			}
			if id == 0 {
				if err := tx.Raw(`SELECT COALESCE(MAX(id), 0) + 1 FROM major`).Scan(&id).Error; err != nil {
					return err
				}
				if err := tx.Exec(`
					INSERT INTO major (id, major_code, name, status, idfaculty)
					VALUES (?, ?, ?, 1, ?)
				`, id, class.Code, class.Code, *facultyID).Error; err != nil {
					return err
				}
			}
			majorID = &id
		}

		if oldCode == "" {
			if err := tx.Exec(`
				INSERT INTO class (id, class_code, name, status, idmajor)
				SELECT COALESCE(MAX(id), 0) + 1, ?, ?, 1, ?
				FROM class
			`, class.Code, class.Code, majorID).Error; err != nil {
				return err
			}
			if err := tx.Table(`class`).Select(`id`).Where(`class_code = ?`, class.Code).Scan(&classID).Error; err != nil {
				return err
			}
		} else {
			result := tx.Exec(`
				UPDATE class
				SET class_code = ?, name = ?, idmajor = ?
				WHERE id = ?
			`, class.Code, class.Code, majorID, classID)
			if result.Error != nil {
				return result.Error
			}
			if result.RowsAffected == 0 {
				return gorm.ErrRecordNotFound
			}
		}

		if class.AcademicYear == "" {
			return tx.Exec(`UPDATE class_year SET status = 0 WHERE idclass = ?`, classID).Error
		}
		var schoolYearID int64
		if err := tx.Table(`school_year`).
			Select(`id`).
			Where(`year = ? AND semester = 1`, class.AcademicYear).
			Order(`id ASC`).
			Limit(1).
			Scan(&schoolYearID).Error; err != nil {
			return err
		}
		if schoolYearID == 0 {
			if err := tx.Raw(`SELECT COALESCE(MAX(id), 0) + 1 FROM school_year`).Scan(&schoolYearID).Error; err != nil {
				return err
			}
			if err := tx.Exec(`INSERT INTO school_year (id, year, semester) VALUES (?, ?, 1)`, schoolYearID, class.AcademicYear).Error; err != nil {
				return err
			}
		}
		if err := tx.Exec(`UPDATE class_year SET status = 0 WHERE idclass = ?`, classID).Error; err != nil {
			return err
		}
		return tx.Exec(`
			INSERT INTO class_year (idclass, idyear, status)
			VALUES (?, ?, 1)
			ON CONFLICT (idclass, idyear) DO UPDATE SET status = 1
		`, classID, schoolYearID).Error
	})
}

func (r *managerRepository) DeleteClass(ctx context.Context, code string) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var classID int64
		if err := tx.Table(`class`).Select(`id`).Where(`class_code = ?`, code).Scan(&classID).Error; err != nil {
			return err
		}
		if classID == 0 {
			return gorm.ErrRecordNotFound
		}
		if err := tx.Exec(`UPDATE class_year SET status = 0 WHERE idclass = ?`, classID).Error; err != nil {
			return err
		}
		result := tx.Exec(`UPDATE class SET status = 0 WHERE id = ?`, classID)
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			return gorm.ErrRecordNotFound
		}
		return nil
	})
}

func (r *managerRepository) UpsertStudent(ctx context.Context, oldID string, student dto.ManagerStudentMutation, passwordHash string) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Exec(`LOCK TABLE "User", student IN EXCLUSIVE MODE`).Error; err != nil {
			return err
		}

		var classID int64
		if err := tx.Table(`class`).Select(`id`).Where(`class_code = ?`, student.ClassCode).Scan(&classID).Error; err != nil {
			return err
		}
		if classID == 0 {
			return gorm.ErrRecordNotFound
		}

		var studentID int64
		var userID *int64
		if oldID != "" {
			var existing struct {
				ID     int64
				UserID *int64 `gorm:"column:iduser"`
			}
			err := tx.Table(`student`).
				Select(`id, iduser`).
				Where(`student_code = ?`, oldID).
				Take(&existing).Error
			if err != nil {
				return err
			}
			studentID = existing.ID
			userID = existing.UserID
		} else {
			var existingCount int64
			if err := tx.Table(`student`).Where(`student_code = ?`, student.StudentID).Count(&existingCount).Error; err != nil {
				return err
			}
			if existingCount > 0 {
				return gorm.ErrDuplicatedKey
			}
		}
		if oldID != "" && student.StudentID != oldID {
			var duplicateCount int64
			if err := tx.Table(`student`).
				Where(`student_code = ? AND id <> ?`, student.StudentID, studentID).
				Count(&duplicateCount).Error; err != nil {
				return err
			}
			if duplicateCount > 0 {
				return gorm.ErrDuplicatedKey
			}
		}

		if userID == nil {
			var existingUserID int64
			if err := tx.Table(`"User"`).Select(`id`).Where(`email = ?`, student.Email).Scan(&existingUserID).Error; err != nil {
				return err
			}
			if existingUserID != 0 {
				return gorm.ErrDuplicatedKey
			}
			if err := tx.Raw(`SELECT COALESCE(MAX(id), 0) + 1 FROM "User"`).Scan(&existingUserID).Error; err != nil {
				return err
			}
			var roleID int64
			if err := tx.Table(`role`).Select(`id`).Where(`name = ?`, "Sinh viên").Limit(1).Scan(&roleID).Error; err != nil {
				return err
			}
			if roleID == 0 {
				return gorm.ErrRecordNotFound
			}
			if err := tx.Exec(`
				INSERT INTO "User" (id, firstname, lastname, gender, dob, birthplace, phone, email, password, status, idrole)
				VALUES (?, ?, ?, ?, ?::date, ?, ?, ?, ?, 1, ?)
			`, existingUserID, student.FirstName, student.LastName, student.Gender, student.BirthDay, student.BirthPlace, student.Phone, student.Email, passwordHash, roleID).Error; err != nil {
				return err
			}
			userID = &existingUserID
		} else {
			result := tx.Exec(`
				UPDATE "User"
				SET firstname = ?, lastname = ?, gender = ?, dob = ?::date,
				    birthplace = ?, phone = ?, email = ?
				WHERE id = ?
			`, student.FirstName, student.LastName, student.Gender, student.BirthDay, student.BirthPlace, student.Phone, student.Email, *userID)
			if result.Error != nil {
				return result.Error
			}
			if result.RowsAffected == 0 {
				return gorm.ErrRecordNotFound
			}
		}

		if oldID == "" {
			if err := tx.Raw(`SELECT COALESCE(MAX(id), 0) + 1 FROM student`).Scan(&studentID).Error; err != nil {
				return err
			}
			return tx.Exec(`
				INSERT INTO student (id, student_code, idclass, iduser)
				VALUES (?, ?, ?, ?)
			`, studentID, student.StudentID, classID, *userID).Error
		}
		result := tx.Exec(`
			UPDATE student SET student_code = ?, idclass = ?, iduser = ?
			WHERE id = ?
		`, student.StudentID, classID, *userID, studentID)
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			return gorm.ErrRecordNotFound
		}
		return nil
	})
}

func (r *managerRepository) DeleteStudent(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		result := tx.Exec(`
			UPDATE "User" u
			SET status = 0
			FROM student s
			WHERE s.student_code = ? AND s.iduser = u.id
		`, id)
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			return gorm.ErrRecordNotFound
		}
		return nil
	})
}
