package service

import (
	"context"
	"errors"
	"strings"
	"time"

	"renluyen-dlu-backend/internal/dto"
	"renluyen-dlu-backend/internal/repository"

	"golang.org/x/crypto/bcrypt"
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
		req.Search,
		req.ClassCode,
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
	account.Gender = strings.TrimSpace(account.Gender)
	account.BirthDay = strings.TrimSpace(account.BirthDay)
	account.Phone = strings.TrimSpace(account.Phone)
	account.Unit = strings.TrimSpace(account.Unit)
	account.Position = strings.TrimSpace(account.Position)
	if account.Name == "" || account.Email == "" || account.RoleCode == "" ||
		account.Gender == "" || account.BirthDay == "" || account.Phone == "" {
		return errors.New("họ tên, email, vai trò, giới tính, ngày sinh và số điện thoại là bắt buộc")
	}
	if _, err := time.Parse("2006-01-02", account.BirthDay); err != nil {
		return errors.New("ngày sinh không hợp lệ")
	}

	passwordHash := ""
	if account.Password != "" {
		hashed, err := bcrypt.GenerateFromPassword([]byte(account.Password), bcrypt.DefaultCost)
		if err != nil {
			return err
		}
		passwordHash = string(hashed)
	} else if id == 0 {
		hashed, err := bcrypt.GenerateFromPassword([]byte(defaultPassword()), bcrypt.DefaultCost)
		if err != nil {
			return err
		}
		passwordHash = string(hashed)
	}
	return s.repo.UpsertAccount(ctx, id, account, passwordHash)
}

func (s *managerService) ResetAccountPassword(ctx context.Context, id int64) error {
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(defaultPassword()), bcrypt.DefaultCost)
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
	if student.StudentID == "" || student.ClassCode == "" || student.Email == "" || student.BirthDay == "" {
		return errors.New("mã sinh viên, email, lớp và ngày sinh là bắt buộc")
	}
	if student.StudentName == "" {
		student.StudentName = strings.TrimSpace(student.FirstName + " " + student.LastName)
	}
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(defaultPassword()), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	return s.repo.UpsertStudent(ctx, oldID, student, string(passwordHash))
}

func defaultPassword() string {
	return "DLU@" + time.Now().Format("2006")
}

func (s *managerService) DeleteStudent(ctx context.Context, id string) error {
	return s.repo.DeleteStudent(ctx, id)
}
