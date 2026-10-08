package service

import (
	"context"
	"errors"
	"testing"

	"renluyen-dlu-backend/internal/dto"
)

type profileRepositoryStub struct {
	studentCode  string
	lecturerCode string
	student      *dto.StudentProfile
	lecturer     *dto.LecturerProfile
	err          error
}

func (r *profileRepositoryStub) GetStudentProfileByCode(
	_ context.Context,
	code string,
) (*dto.StudentProfile, error) {
	r.studentCode = code
	return r.student, r.err
}

func (r *profileRepositoryStub) GetLecturerProfileByCode(
	_ context.Context,
	code string,
) (*dto.LecturerProfile, error) {
	r.lecturerCode = code
	return r.lecturer, r.err
}

func TestGetStudentProfileTrimsCode(t *testing.T) {
	expected := &dto.StudentProfile{StudentCode: "SV001"}
	repo := &profileRepositoryStub{student: expected}
	svc := NewProfileService(repo)

	got, err := svc.GetStudentProfile(context.Background(), " SV001 ")
	if err != nil {
		t.Fatalf("GetStudentProfile() error = %v", err)
	}
	if repo.studentCode != "SV001" {
		t.Fatalf("repository received code %q, want %q", repo.studentCode, "SV001")
	}
	if got != expected {
		t.Fatalf("GetStudentProfile() = %v, want %v", got, expected)
	}
}

func TestGetLecturerProfileTrimsCode(t *testing.T) {
	expected := &dto.LecturerProfile{LecturerCode: "GV001"}
	repo := &profileRepositoryStub{lecturer: expected}
	svc := NewProfileService(repo)

	got, err := svc.GetLecturerProfile(context.Background(), " GV001 ")
	if err != nil {
		t.Fatalf("GetLecturerProfile() error = %v", err)
	}
	if repo.lecturerCode != "GV001" {
		t.Fatalf("repository received code %q, want %q", repo.lecturerCode, "GV001")
	}
	if got != expected {
		t.Fatalf("GetLecturerProfile() = %v, want %v", got, expected)
	}
}

func TestGetProfilesRejectBlankCodes(t *testing.T) {
	repo := &profileRepositoryStub{}
	svc := NewProfileService(repo)

	if _, err := svc.GetStudentProfile(context.Background(), "  "); !errors.Is(err, ErrProfileCodeRequired) {
		t.Fatalf("GetStudentProfile() error = %v, want %v", err, ErrProfileCodeRequired)
	}
	if _, err := svc.GetLecturerProfile(context.Background(), "  "); !errors.Is(err, ErrProfileCodeRequired) {
		t.Fatalf("GetLecturerProfile() error = %v, want %v", err, ErrProfileCodeRequired)
	}
	if repo.studentCode != "" || repo.lecturerCode != "" {
		t.Fatalf("repository called for blank profile code: student=%q lecturer=%q", repo.studentCode, repo.lecturerCode)
	}
}
