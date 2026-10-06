package repository

import (
	"context"
	"time"

	"renluyen-dlu-backend/internal/model"

	"gorm.io/gorm"
)

type EvidenceRepository interface {
	GetEvidences(ctx context.Context, search string, status *int, facultyID, majorID, classID *int64, fromDate, toDate *time.Time) ([]model.Evidence, error)
	GetEvidenceFilterOptions(ctx context.Context) ([]model.Faculty, []model.Major, []model.Class, error)
	GetEvidenceStats(ctx context.Context) (map[string]int64, error)
	GetEvidenceDetail(ctx context.Context, evidenceID int64) (*model.Evidence, error)
	UpdateEvidenceStatus(ctx context.Context, evidenceID int64, status int) error
	ApproveEvidenceList(ctx context.Context, evidenceIDs []int64) (int64, error)
}

type evidenceRepository struct{ db *gorm.DB }

func NewEvidenceRepository(db *gorm.DB) EvidenceRepository {
	return &evidenceRepository{db: db}
}

func (r *evidenceRepository) GetEvidences(ctx context.Context, search string, status *int, facultyID, majorID, classID *int64, fromDate, toDate *time.Time) ([]model.Evidence, error) {
	var evidences []model.Evidence
	query := r.db.WithContext(ctx).Model(&model.Evidence{}).
		Preload("Registration.Student.User").
		Preload("Registration.Student.Class.Major.Faculty").
		Preload("Registration.Student.Class.ClassYears", func(db *gorm.DB) *gorm.DB {
			return db.Where("status = ?", 1).Order("idyear DESC")
		}).
		Preload("Registration.Student.Class.ClassYears.Year").
		Preload("Registration.Activity").
		Joins("JOIN activity_registration ar ON ar.id = evidence.idacregis").
		Joins("JOIN student s ON s.id = ar.idstudent").
		Joins(`JOIN "User" u ON u.id = s.iduser`).
		Joins("JOIN activity a ON a.id = ar.idactivity")

	if search != "" {
		pattern := "%" + search + "%"
		query = query.Where(`(a.title ILIKE ? OR a.activity_code ILIKE ? OR s.student_code ILIKE ? OR u.firstname ILIKE ? OR u.lastname ILIKE ? OR CONCAT(u.lastname, ' ', u.firstname) ILIKE ?)`, pattern, pattern, pattern, pattern, pattern, pattern)
	}
	if fromDate != nil {
		query = query.Where("ar.registeredat >= ?", fromDate)
	}
	if toDate != nil {
		endExclusive := time.Date(toDate.Year(), toDate.Month(), toDate.Day()+1, 0, 0, 0, 0, toDate.Location())
		query = query.Where("ar.registeredat < ?", endExclusive)
	}
	if status != nil {
		query = query.Where("evidence.status = ?", *status)
	}
	if classID != nil {
		query = query.Where("s.idclass = ?", *classID)
	} else if facultyID != nil || majorID != nil {
		query = query.Joins("JOIN class c ON c.id = s.idclass").
			Joins("JOIN major m ON m.id = c.idmajor")
		if majorID != nil {
			query = query.Where("c.idmajor = ?", *majorID)
		}
		if facultyID != nil {
			query = query.Where("m.idfaculty = ?", *facultyID)
		}
	}
	err := query.Order("evidence.id DESC").Find(&evidences).Error
	return evidences, err
}

func (r *evidenceRepository) GetEvidenceFilterOptions(ctx context.Context) ([]model.Faculty, []model.Major, []model.Class, error) {
	var faculties []model.Faculty
	var majors []model.Major
	var classes []model.Class
	if err := r.db.WithContext(ctx).Where("status = ?", 1).Order("name ASC").Find(&faculties).Error; err != nil {
		return nil, nil, nil, err
	}
	if err := r.db.WithContext(ctx).Where("status = ?", 1).Order("name ASC").Find(&majors).Error; err != nil {
		return nil, nil, nil, err
	}
	if err := r.db.WithContext(ctx).Where("status = ?", 1).Order("name ASC").Find(&classes).Error; err != nil {
		return nil, nil, nil, err
	}
	return faculties, majors, classes, nil
}

func (r *evidenceRepository) GetEvidenceStats(ctx context.Context) (map[string]int64, error) {
	type stat struct {
		Status int
		Count  int64
	}
	var rows []stat
	err := r.db.WithContext(ctx).Model(&model.Evidence{}).
		Select("status, COUNT(*) AS count").Group("status").Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	stats := map[string]int64{"total": 0, "pending": 0, "approved": 0, "rejected": 0}
	for _, row := range rows {
		stats["total"] += row.Count
		switch row.Status {
		case 0:
			stats["pending"] = row.Count
		case 1:
			stats["approved"] = row.Count
		case 2:
			stats["rejected"] = row.Count
		}
	}
	return stats, nil
}

func (r *evidenceRepository) GetEvidenceDetail(ctx context.Context, evidenceID int64) (*model.Evidence, error) {
	var evidence model.Evidence
	err := r.db.WithContext(ctx).
		Preload("Registration.Student.User").
		Preload("Registration.Student.Class.Major.Faculty").
		Preload("Registration.Student.Class.ClassYears", func(db *gorm.DB) *gorm.DB {
			return db.Where("status = ?", 1).Order("idyear DESC")
		}).
		Preload("Registration.Student.Class.ClassYears.Year").
		Preload("Registration.Activity").
		First(&evidence, "id = ?", evidenceID).Error
	if err != nil {
		return nil, err
	}
	return &evidence, nil
}

func (r *evidenceRepository) UpdateEvidenceStatus(ctx context.Context, evidenceID int64, status int) error {
	result := r.db.WithContext(ctx).Model(&model.Evidence{}).Where("id = ?", evidenceID).Update("status", status)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *evidenceRepository) ApproveEvidenceList(ctx context.Context, evidenceIDs []int64) (int64, error) {
	var updatedCount int64
	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var existingCount int64
		if err := tx.Model(&model.Evidence{}).Where("id IN ?", evidenceIDs).Count(&existingCount).Error; err != nil {
			return err
		}
		if existingCount != int64(len(evidenceIDs)) {
			return gorm.ErrRecordNotFound
		}
		result := tx.Model(&model.Evidence{}).Where("id IN ?", evidenceIDs).Update("status", int(model.EvidenceStatusApproved))
		if result.Error != nil {
			return result.Error
		}
		updatedCount = result.RowsAffected
		return nil
	})
	return updatedCount, err
}
