package repository

import (
	"context"

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
		Table(`students s`).
		Select(`
			s.student_id AS id,
			s.student_id AS mssv,
			COALESCE(NULLIF(s.student_name, ''), CONCAT_WS(' ', s.first_name, s.last_name), s.student_id) AS name,
			COALESCE(s.first_name, '') AS first_name,
			COALESCE(s.last_name, '') AS last_name,
			s.class_code AS class_code,
			c.code AS class_name,
			COALESCE(c.faculty, '') AS faculty_name,
			COALESCE(s.study_program_id, '') AS study_program_id,
			COALESCE(s.gender, '') AS gender,
			COALESCE(s.birth_day::text, '') AS birth_day,
			COALESCE(s.birth_place, '') AS birth_place,
			COALESCE(s.phone, '') AS phone,
			COALESCE(u.email, '') AS email,
			COALESCE(s.hometown_country, '') AS hometown_country,
			COALESCE(s.hometown_province, '') AS hometown_province,
			COALESCE(s.hometown_city, '') AS hometown_city,
			COALESCE(s.hometown_address, '') AS hometown_address,
			COALESCE(s.is_in_class, false) AS is_in_class,
			COALESCE(s.class_role_id, 0) AS class_role_id,
			COALESCE(s.permanent_residence, '') AS permanent_residence
		`).
		Joins(`LEFT JOIN classes c ON c.code = s.class_code`).
		Joins(`LEFT JOIN users u ON u.student_id = s.student_id`)

	if search != "" {
		pattern := "%" + search + "%"

		query = query.Where(`
			s.student_id ILIKE ?
			OR COALESCE(s.student_name, CONCAT_WS(' ', s.first_name, s.last_name)) ILIKE ?
			OR s.class_code ILIKE ?
			OR COALESCE(s.study_program_id, '') ILIKE ?
		`,
			pattern,
			pattern,
			pattern,
			pattern,
		)
	}

	if classCode != "" {
		query = query.Where(
			`s.class_code = ?`,
			classCode,
		)
	}

	err := query.
		Order(`s.student_id ASC`).
		Scan(&students).
		Error

	return students, err
}

func (r *managerRepository) GetClasses(ctx context.Context) ([]dto.ManagerClass, error) {
	var classes []dto.ManagerClass
	err := r.db.WithContext(ctx).
		Table(`classes c`).
		Select(`c.code, COALESCE(c.faculty, '') AS faculty, COALESCE(c.academic_year, '') AS academic_year, COUNT(s.student_id) AS student_count`).
		Joins(`LEFT JOIN students s ON s.class_code = c.code`).
		Group(`c.code, c.faculty, c.academic_year`).
		Order(`c.code ASC`).
		Scan(&classes).Error
	return classes, err
}

func (r *managerRepository) GetAccounts(ctx context.Context) ([]dto.ManagerAccount, error) {
	var accounts []dto.ManagerAccount
	err := r.db.WithContext(ctx).
		Table(`users u`).
		Select(`u.id, u.full_name AS name, u.username, u.email, r.name AS role, r.code AS role_code, u.unit, COALESCE(u.class_code, '') AS class_code, COALESCE(c.code, '') AS class_name, COALESCE(u.student_id, '') AS student_id, CASE WHEN u.status THEN 'Đang hoạt động' ELSE 'Đã khóa' END AS status, u.status AS active, COALESCE(to_char(u.last_login, 'YYYY-MM-DD HH24:MI'), 'Chưa đăng nhập') AS last_login`).
		Joins(`JOIN roles r ON r.id = u.role_id`).
		Joins(`LEFT JOIN classes c ON c.code = u.class_code`).
		Order(`u.id ASC`).
		Scan(&accounts).Error
	return accounts, err
}

func (r *managerRepository) GetAccountResetSeed(ctx context.Context, id int64) (string, error) {
	var seed string
	err := r.db.WithContext(ctx).
		Table(`users`).
		Select(`COALESCE(NULLIF(student_id, ''), split_part(email, '@', 1))`).
		Where(`id = ?`, id).
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
		Exec(`UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?`, passwordHash, id)
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
		Table(`roles`).
		Select(`code, name`).
		Order(`id ASC`).
		Scan(&roles).Error
	return roles, err
}

func (r *managerRepository) UpsertAccount(ctx context.Context, id int64, account dto.ManagerAccountMutation, passwordHash string) error {
	if id == 0 {
		return r.db.WithContext(ctx).Exec(`
			INSERT INTO users (full_name, username, email, password_hash, role_id, unit, class_code, status)
			VALUES (?, ?, ?, ?, (SELECT id FROM roles WHERE code = ?), ?, NULLIF(?, ''), ?)
		`, account.Name, account.Username, account.Email, passwordHash, account.RoleCode, account.Unit, account.ClassCode, account.Active).Error
	}

	result := r.db.WithContext(ctx).Exec(`
		UPDATE users
		SET full_name = ?, username = ?, email = ?,
		    password_hash = CASE WHEN ? = '' THEN password_hash ELSE ? END,
		    role_id = (SELECT id FROM roles WHERE code = ?),
		    unit = ?, class_code = NULLIF(?, ''), status = ?, updated_at = NOW()
		WHERE id = ?
	`, account.Name, account.Username, account.Email, passwordHash, passwordHash, account.RoleCode, account.Unit, account.ClassCode, account.Active, id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *managerRepository) DeleteAccount(ctx context.Context, id int64) error {
	result := r.db.WithContext(ctx).Exec(`DELETE FROM users WHERE id = ? AND email <> '2312610@dlu.edu.vn'`, id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *managerRepository) UpsertClass(ctx context.Context, oldCode string, class dto.ManagerClassMutation) error {
	if oldCode == "" {
		return r.db.WithContext(ctx).Exec(`
			INSERT INTO classes (code, faculty, academic_year)
			VALUES (?, ?, ?)
		`, class.Code, class.Faculty, class.AcademicYear).Error
	}
	result := r.db.WithContext(ctx).Exec(`
		UPDATE classes SET code = ?, faculty = ?, academic_year = ?, updated_at = NOW()
		WHERE code = ?
	`, class.Code, class.Faculty, class.AcademicYear, oldCode)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *managerRepository) DeleteClass(ctx context.Context, code string) error {
	result := r.db.WithContext(ctx).Exec(`DELETE FROM classes WHERE code = ?`, code)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *managerRepository) UpsertStudent(ctx context.Context, oldID string, student dto.ManagerStudentMutation, passwordHash string) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if oldID == "" {
			if err := tx.Exec(`
				INSERT INTO students (student_id, class_code, gender, birth_day, first_name, last_name, is_in_class, birth_place, phone, class_role_id, study_program_id, permanent_residence, student_name, hometown_country, hometown_province, hometown_city, hometown_address)
					VALUES (?, ?, ?, NULLIF(?, '')::date, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
				`, student.StudentID, student.ClassCode, student.Gender, student.BirthDay, student.FirstName, student.LastName, student.IsInClass, student.BirthPlace, student.Phone, student.ClassRoleID, student.StudyProgramID, student.PermanentResidence, student.StudentName, student.HometownCountry, student.HometownProvince, student.HometownCity, student.HometownAddress).Error; err != nil {
				return err
			}
		} else {
			result := tx.Exec(`
				UPDATE students
				SET student_id = ?, class_code = ?, gender = ?, birth_day = NULLIF(?, '')::date,
				    first_name = ?, last_name = ?, is_in_class = ?, birth_place = ?, phone = ?,
				    class_role_id = ?, study_program_id = ?, permanent_residence = ?, student_name = ?,
				    hometown_country = ?, hometown_province = ?, hometown_city = ?, hometown_address = ?, synced_at = NOW()
				WHERE student_id = ?
			`, student.StudentID, student.ClassCode, student.Gender, student.BirthDay, student.FirstName, student.LastName, student.IsInClass, student.BirthPlace, student.Phone, student.ClassRoleID, student.StudyProgramID, student.PermanentResidence, student.StudentName, student.HometownCountry, student.HometownProvince, student.HometownCity, student.HometownAddress, oldID)
			if result.Error != nil {
				return result.Error
			}
			if result.RowsAffected == 0 {
				return gorm.ErrRecordNotFound
			}
		}
		if student.Faculty != "" {
			if err := tx.Exec(`UPDATE classes SET faculty = ?, updated_at = NOW() WHERE code = ?`, student.Faculty, student.ClassCode).Error; err != nil {
				return err
			}
		}

		var linkedAccountCount int64
		if err := tx.Table(`users`).Where(`student_id = ?`, student.StudentID).Count(&linkedAccountCount).Error; err != nil {
			return err
		}
		if linkedAccountCount > 0 {
			return tx.Exec(`
				UPDATE users
				SET full_name = ?, username = ?, email = ?, class_code = ?,
				    unit = (SELECT COALESCE(faculty, '') FROM classes WHERE code = ?), updated_at = NOW()
				WHERE student_id = ?
			`, student.StudentName, student.Email, student.Email, student.ClassCode, student.ClassCode, student.StudentID).Error
		}

		return tx.Exec(`
			INSERT INTO users (full_name, username, email, password_hash, role_id, unit, class_code, student_id, status)
			VALUES (?, ?, ?, ?, (SELECT id FROM roles WHERE code = 'STUDENT'),
			        (SELECT COALESCE(faculty, '') FROM classes WHERE code = ?), ?, ?, TRUE)
		`, student.StudentName, student.Email, student.Email, passwordHash, student.ClassCode, student.ClassCode, student.StudentID).Error
	})
}

func (r *managerRepository) DeleteStudent(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Exec(`DELETE FROM users WHERE student_id = ? AND role_id = (SELECT id FROM roles WHERE code = 'STUDENT')`, id).Error; err != nil {
			return err
		}
		result := tx.Exec(`DELETE FROM students WHERE student_id = ?`, id)
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			return gorm.ErrRecordNotFound
		}
		return nil
	})
}
