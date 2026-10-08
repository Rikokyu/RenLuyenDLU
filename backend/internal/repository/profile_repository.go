package repository

import (
	"context"

	"renluyen-dlu-backend/internal/dto"

	"gorm.io/gorm"
)

type ProfileRepository interface {
	GetStudentProfileByCode(ctx context.Context, studentCode string) (*dto.StudentProfile, error)
	GetLecturerProfileByCode(ctx context.Context, lecturerCode string) (*dto.LecturerProfile, error)
}

type profileRepository struct {
	db *gorm.DB
}

func NewProfileRepository(db *gorm.DB) ProfileRepository {
	return &profileRepository{db: db}
}

func (r *profileRepository) GetStudentProfileByCode(
	ctx context.Context,
	studentCode string,
) (*dto.StudentProfile, error) {
	var profile dto.StudentProfile
	err := r.db.WithContext(ctx).
		Table(`student s`).
		Select(`
			s.student_code AS student_code,
			COALESCE(u.firstname, '') AS first_name,
			COALESCE(u.lastname, '') AS last_name,
			COALESCE(CONCAT_WS(' ', u.firstname, u.lastname), '') AS full_name,
			COALESCE(u.gender, '') AS gender,
			COALESCE(u.dob::text, '') AS birth_date,
			COALESCE(u.birthplace, '') AS birth_place,
			COALESCE(u.phone, '') AS phone,
			COALESCE(u.email, '') AS email,
			COALESCE(c.class_code, '') AS class_code,
			COALESCE(c.name, '') AS class_name,
			COALESCE(m.major_code, '') AS major_code,
			COALESCE(m.name, '') AS major_name,
			COALESCE(f.faculty_code, '') AS faculty_code,
			COALESCE(f.name, '') AS faculty_name
		`).
		Joins(`JOIN "User" u ON u.id = s.iduser`).
		Joins(`LEFT JOIN class c ON c.id = s.idclass`).
		Joins(`LEFT JOIN major m ON m.id = c.idmajor`).
		Joins(`LEFT JOIN faculty f ON f.id = m.idfaculty`).
		Where(`s.student_code = ? OR lower(u.email) = lower(?)`, studentCode, studentCode).
		Where(`COALESCE(u.status, 1) <> 0`).
		Order(`s.id ASC`).
		Take(&profile).Error
	if err != nil {
		return nil, err
	}
	return &profile, nil
}

func (r *profileRepository) GetLecturerProfileByCode(
	ctx context.Context,
	lecturerCode string,
) (*dto.LecturerProfile, error) {
	var profile dto.LecturerProfile
	err := r.db.WithContext(ctx).
		Table(`lecturer l`).
		Select(`
			l.lecturer_code AS lecturer_code,
			COALESCE(u.firstname, '') AS first_name,
			COALESCE(u.lastname, '') AS last_name,
			COALESCE(CONCAT_WS(' ', u.firstname, u.lastname), '') AS full_name,
			COALESCE(u.gender, '') AS gender,
			COALESCE(u.dob::text, '') AS birth_date,
			COALESCE(u.birthplace, '') AS birth_place,
			COALESCE(u.phone, '') AS phone,
			COALESCE(u.email, '') AS email,
			COALESCE(f.faculty_code, '') AS faculty_code,
			COALESCE(f.name, '') AS faculty_name
		`).
		Joins(`JOIN "User" u ON u.id = l.iduser`).
		Joins(`LEFT JOIN faculty f ON f.id = l.idfaculty`).
		Where(`l.lecturer_code = ? OR lower(u.email) = lower(?)`, lecturerCode, lecturerCode).
		Where(`COALESCE(u.status, 1) <> 0`).
		Order(`l.id ASC`).
		Take(&profile).Error
	if err != nil {
		return nil, err
	}
	return &profile, nil
}
