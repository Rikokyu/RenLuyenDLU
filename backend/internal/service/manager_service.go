package service

import (
	"context"
	"errors"
	"net/mail"
	"regexp"
	"strings"
	"time"

	"renluyen-dlu-backend/internal/dto"
	"renluyen-dlu-backend/internal/repository"

	"golang.org/x/crypto/bcrypt"
)

var (
	managerPhonePattern = regexp.MustCompile(`^[0-9]{10}$`)
	studentIDPattern    = regexp.MustCompile(`^[0-9]{7}$`)
)

type ManagerService interface {
	GetStudents(
		ctx context.Context,
		req dto.ManagerStudentQuery,
	) ([]dto.ManagerStudent, error)
	GetClasses(ctx context.Context) ([]dto.ManagerClass, error)
	GetAccounts(ctx context.Context) ([]dto.ManagerAccount, error)
	GetRoles(ctx context.Context) ([]dto.ManagerRole, error)
	ResetAccountPassword(ctx context.Context, id int64) error
	SaveAccount(ctx context.Context, id int64, account dto.ManagerAccountMutation) error
	DeleteAccount(ctx context.Context, id int64) error
	SaveClass(ctx context.Context, oldCode string, class dto.ManagerClassMutation) error
	DeleteClass(ctx context.Context, code string) error
	SaveStudent(ctx context.Context, oldID string, student dto.ManagerStudentMutation) error
	UpdateStudentStatus(ctx context.Context, id, status string) error
	DeleteStudent(ctx context.Context, id string) error
}

type managerService struct {
	repo repository.ManagerRepository
}

func NewManagerService(
	repo repository.ManagerRepository,
) ManagerService {
	return &managerService{
		repo: repo,
	}
}

func (s *managerService) GetStudents(
	ctx context.Context,
	req dto.ManagerStudentQuery,
) ([]dto.ManagerStudent, error) {

	return s.repo.GetStudents(
		ctx,
		req,
	)
}

func (s *managerService) GetClasses(ctx context.Context) ([]dto.ManagerClass, error) {
	return s.repo.GetClasses(ctx)
}

func (s *managerService) GetAccounts(ctx context.Context) ([]dto.ManagerAccount, error) {
	return s.repo.GetAccounts(ctx)
}

func (s *managerService) GetRoles(ctx context.Context) ([]dto.ManagerRole, error) {
	return s.repo.GetRoles(ctx)
}

func (s *managerService) SaveAccount(ctx context.Context, id int64, account dto.ManagerAccountMutation) error {
	account.Name = strings.TrimSpace(account.Name)
	account.Email = strings.ToLower(strings.TrimSpace(account.Email))
	account.Username = account.Email
	account.RoleCode = strings.TrimSpace(account.RoleCode)
	account.Unit = strings.TrimSpace(account.Unit)
	account.ClassCode = strings.ToUpper(strings.TrimSpace(account.ClassCode))
	account.Position = strings.TrimSpace(account.Position)
	account.Gender = strings.TrimSpace(account.Gender)
	account.BirthDay = strings.TrimSpace(account.BirthDay)
	account.Phone = strings.TrimSpace(account.Phone)
	if account.Name == "" || account.Email == "" || account.RoleCode == "" ||
		account.Gender == "" || account.BirthDay == "" || account.Phone == "" {
		return errors.New("họ tên, email, vai trò, giới tính, ngày sinh và số điện thoại là bắt buộc")
	}
	if !validUniversityEmail(account.Email) {
		return errors.New("email phải đúng định dạng và có đuôi @dlu.edu.vn")
	}
	if !managerPhonePattern.MatchString(account.Phone) {
		return errors.New("số điện thoại phải gồm đúng 10 chữ số")
	}
	if account.RoleCode == "HOMEROOM_CLASS_OFFICER" &&
		(account.ClassCode == "" || account.Position == "") {
		return errors.New("lớp và chức vụ là bắt buộc với vai trò giảng viên / ban cán sự")
	}
	if account.RoleCode == "STUDENT_AFFAIRS_ASSISTANT" && account.Unit == "" {
		return errors.New("khoa phụ trách là bắt buộc với trợ lý công tác sinh viên")
	}
	if _, err := time.Parse("2006-01-02", account.BirthDay); err != nil {
		return errors.New("ngày sinh không hợp lệ")
	}
	if account.RoleCode == "STUDENT" {
		account.StudentID = strings.TrimSpace(account.StudentID)
		if !studentIDPattern.MatchString(account.StudentID) {
			return errors.New("mã sinh viên phải gồm đúng 7 chữ số")
		}
		if account.ClassCode == "" {
			return errors.New("lớp là bắt buộc với vai trò sinh viên")
		}
		oldStudentID := account.OriginalStudentID
		if oldStudentID == "" && id != 0 {
			oldStudentID = account.StudentID
		}
		if err := s.SaveStudent(ctx, oldStudentID, dto.ManagerStudentMutation{
			StudentID:        account.StudentID,
			Email:            account.Email,
			ClassCode:        account.ClassCode,
			Gender:           account.Gender,
			BirthDay:         account.BirthDay,
			StudentName:      account.Name,
			BirthPlace:       account.BirthPlace,
			Phone:            account.Phone,
			HometownCountry:  account.HometownCountry,
			HometownProvince: account.HometownProvince,
			HometownCity:     account.HometownCity,
			HometownAddress:  account.HometownAddress,
			AcademicStatus:   account.AcademicStatus,
		}); err != nil {
			return err
		}
		if id == 0 {
			return nil
		}
		return s.repo.UpsertAccount(ctx, id, account, "")
	}

	passwordHash := ""
	if account.Password != "" {
		hashed, err := bcrypt.GenerateFromPassword([]byte(account.Password), bcrypt.DefaultCost)
		if err != nil {
			return err
		}
		passwordHash = string(hashed)
	} else if id == 0 {
		hashed, err := bcrypt.GenerateFromPassword([]byte(defaultPassword), bcrypt.DefaultCost)
		if err != nil {
			return err
		}
		passwordHash = string(hashed)
	}
	return s.repo.UpsertAccount(ctx, id, account, passwordHash)
}

func (s *managerService) ResetAccountPassword(ctx context.Context, id int64) error {
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(defaultPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	return s.repo.ResetAccountPassword(ctx, id, string(passwordHash))
}

func (s *managerService) DeleteAccount(ctx context.Context, id int64) error {
	return s.repo.DeleteAccount(ctx, id)
}

func (s *managerService) SaveClass(ctx context.Context, oldCode string, class dto.ManagerClassMutation) error {
	class.Code = strings.ToUpper(strings.TrimSpace(class.Code))
	class.Faculty = strings.TrimSpace(class.Faculty)
	class.AcademicYear = strings.TrimSpace(class.AcademicYear)
	if class.Code == "" {
		return errors.New("mã lớp là bắt buộc")
	}
	return s.repo.UpsertClass(ctx, oldCode, class)
}

func (s *managerService) DeleteClass(ctx context.Context, code string) error {
	return s.repo.DeleteClass(ctx, code)
}

func (s *managerService) SaveStudent(ctx context.Context, oldID string, student dto.ManagerStudentMutation) error {
	student.StudentID = strings.TrimSpace(student.StudentID)
	student.Email = strings.ToLower(strings.TrimSpace(student.Email))
	student.ClassCode = strings.ToUpper(strings.TrimSpace(student.ClassCode))
	student.Faculty = strings.TrimSpace(student.Faculty)
	student.Phone = strings.TrimSpace(student.Phone)
	student.HometownCountry = strings.TrimSpace(student.HometownCountry)
	student.HometownProvince = strings.TrimSpace(student.HometownProvince)
	student.HometownCity = strings.TrimSpace(student.HometownCity)
	student.HometownAddress = strings.TrimSpace(student.HometownAddress)
	student.FirstName = strings.TrimSpace(student.FirstName)
	student.LastName = strings.TrimSpace(student.LastName)
	student.StudentName = strings.TrimSpace(student.StudentName)
	if !studentIDPattern.MatchString(student.StudentID) {
		return errors.New("mã sinh viên phải gồm đúng 7 chữ số")
	}
	if student.ClassCode == "" || student.Email == "" || student.BirthDay == "" || student.StudentName == "" {
		return errors.New("họ tên, mã sinh viên, email, lớp và ngày sinh là bắt buộc")
	}
	if !validUniversityEmail(student.Email) {
		return errors.New("email phải đúng định dạng và có đuôi @dlu.edu.vn")
	}
	if student.Phone != "" && !managerPhonePattern.MatchString(student.Phone) {
		return errors.New("số điện thoại phải gồm đúng 10 chữ số")
	}
	if _, err := time.Parse("2006-01-02", student.BirthDay); err != nil {
		return errors.New("ngày sinh không hợp lệ")
	}
	if student.AcademicStatus == "" {
		student.AcademicStatus = "STUDYING"
	}
	if !validAcademicStatus(student.AcademicStatus) {
		return errors.New("trạng thái sinh viên không hợp lệ")
	}
	student.FirstName, student.LastName = splitStudentName(student.StudentName)
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(defaultPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	return s.repo.UpsertStudent(ctx, oldID, student, string(passwordHash))
}

func (s *managerService) UpdateStudentStatus(ctx context.Context, id, status string) error {
	status = strings.TrimSpace(status)
	if !validAcademicStatus(status) {
		return errors.New("trạng thái sinh viên không hợp lệ")
	}
	return s.repo.UpdateStudentStatus(ctx, id, status)
}

func validUniversityEmail(email string) bool {
	address, err := mail.ParseAddress(email)
	return err == nil && address.Address == email && strings.HasSuffix(strings.ToLower(email), "@dlu.edu.vn")
}

func validAcademicStatus(status string) bool {
	switch status {
	case "STUDYING", "LEAVE", "RESERVED", "SUSPENDED", "GRADUATED", "OTHER":
		return true
	default:
		return false
	}
}

func splitStudentName(name string) (string, string) {
	parts := strings.Fields(name)
	if len(parts) < 2 {
		return name, ""
	}
	return strings.Join(parts[:len(parts)-1], " "), parts[len(parts)-1]
}

func (s *managerService) DeleteStudent(ctx context.Context, id string) error {
	return s.repo.DeleteStudent(ctx, id)
}
