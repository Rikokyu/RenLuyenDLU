package service

import (
	"context"
	"errors"
	"strings"

	"renluyen-dlu-backend/internal/dto"
	"renluyen-dlu-backend/internal/repository"
)

var ErrProfileCodeRequired = errors.New("mã hồ sơ là bắt buộc")

type ProfileService interface {
	GetStudentProfile(ctx context.Context, studentCode string) (*dto.StudentProfile, error)
	GetLecturerProfile(ctx context.Context, lecturerCode string) (*dto.LecturerProfile, error)
}

type profileService struct {
	repo repository.ProfileRepository
}

func NewProfileService(repo repository.ProfileRepository) ProfileService {
	return &profileService{repo: repo}
}

func (s *profileService) GetStudentProfile(
	ctx context.Context,
	studentCode string,
) (*dto.StudentProfile, error) {
	studentCode = strings.TrimSpace(studentCode)
	if studentCode == "" {
		return nil, ErrProfileCodeRequired
	}
	return s.repo.GetStudentProfileByCode(ctx, studentCode)
}

func (s *profileService) GetLecturerProfile(
	ctx context.Context,
	lecturerCode string,
) (*dto.LecturerProfile, error) {
	lecturerCode = strings.TrimSpace(lecturerCode)
	if lecturerCode == "" {
		return nil, ErrProfileCodeRequired
	}
	return s.repo.GetLecturerProfileByCode(ctx, lecturerCode)
}
