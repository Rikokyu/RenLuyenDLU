package repository

import (
	"context"
	"database/sql"
	"errors"
	"strings"

	"gorm.io/gorm"
	"renluyen-dlu-backend/internal/model"
)

type ReportDetailsRepository interface {
	GetDetails(context.Context, int64, string, model.ReportDetailQuery) (*model.ReportDetails, error)
}
type reportDetailsRepository struct{ db *gorm.DB }

const MaxReportExportRows int64 = 50000

var ErrReportExportTooLarge = errors.New("report export exceeds row limit")

func NewReportDetailsRepository(db *gorm.DB) ReportDetailsRepository {
	return &reportDetailsRepository{db: db}
}

func (r *reportDetailsRepository) GetDetails(ctx context.Context, userID int64, role string, q model.ReportDetailQuery) (*model.ReportDetails, error) {
	if role != "ADMIN" && role != "STUDENT_AFFAIRS_ASSISTANT" {
		return nil, ErrReportForbidden
	}
	result := &model.ReportDetails{Items: []model.ReportDetailRow{}, Classes: []model.ReportClassOption{}, Page: q.Page, PageSize: q.PageSize}
	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		scope, err := (&dashboardRepository{db: tx}).resolveDashboardScope(ctx, userID, role)
		if err != nil {
			return err
		}
		result.ScopeName = scope.name
		// Options are scoped independently of the current page/search; empty classes remain selectable.
		if err := tx.Raw(`SELECT c.id, COALESCE(NULLIF(c.class_code,''),c.name,'') AS name,
		 COALESCE(m.id,0) AS major_id,COALESCE(m.name,'') AS major_name,
		 COALESCE(f.id,0) AS faculty_id,COALESCE(f.name,'') AS faculty_name
		 FROM class c LEFT JOIN major m ON m.id=c.idmajor LEFT JOIN faculty f ON f.id=m.idfaculty
		 WHERE `+scope.studentPredicateOrTrue()+` ORDER BY c.class_code,c.id`, scope.studentArgs...).Scan(&result.Classes).Error; err != nil {
			return err
		}
		cte := `WITH registrations AS (
		 SELECT DISTINCT ON (ar.idstudent,ar.idactivity) ar.id,ar.idstudent,ar.idactivity
		 FROM activity_registration ar WHERE COALESCE(ar.status,0)=1
		 ORDER BY ar.idstudent,ar.idactivity,ar.registeredat DESC,ar.id DESC
		), details AS (
		 SELECT ar.id,s.student_code AS student_id,CONCAT_WS(' ',u.firstname,u.lastname) AS student_name,
		 COALESCE(c.class_code,'') AS class_name,COALESCE(m.name,'') AS major,COALESCE(f.name,'') AS faculty,
		 a.title AS event_name,a.activity_code,a.score AS activity_score,
		 ev.id AS evidence_id,(ev.submitat AT TIME ZONE 'Asia/Ho_Chi_Minh') AS submitted_at,ev.status
		 FROM registrations ar JOIN student s ON s.id=ar.idstudent
		 JOIN "User" u ON u.id=s.iduser JOIN activity a ON a.id=ar.idactivity
		 LEFT JOIN class c ON c.id=s.idclass LEFT JOIN major m ON m.id=c.idmajor LEFT JOIN faculty f ON f.id=m.idfaculty
		 LEFT JOIN LATERAL (SELECT e.id,e.submitat,e.status FROM evidence e WHERE e.idacregis=ar.id ORDER BY e.id DESC LIMIT 1) ev ON TRUE
		 WHERE COALESCE(a.status,0)<>0 AND (` + scope.studentPredicateOrTrue() + `)`
		args := append([]any{}, scope.studentArgs...)
		if q.FacultyID > 0 {
			cte += ` AND m.idfaculty=?`
			args = append(args, q.FacultyID)
		}
		if q.MajorID > 0 {
			cte += ` AND c.idmajor=?`
			args = append(args, q.MajorID)
		}
		if q.ClassID > 0 {
			cte += ` AND s.idclass=?`
			args = append(args, q.ClassID)
		}
		if q.Search != "" {
			// Escape LIKE metacharacters so user input is a literal substring.
			pattern := "%" + strings.NewReplacer(`\`, `\\`, `%`, `\%`, `_`, `\_`).Replace(q.Search) + "%"
			cte += ` AND (s.student_code ILIKE ? OR CONCAT_WS(' ',u.firstname,u.lastname) ILIKE ? OR a.title ILIKE ? OR a.activity_code ILIKE ?)`
			args = append(args, pattern, pattern, pattern, pattern)
		}
		cte += `)`
		if err := tx.Raw(cte+` SELECT COUNT(*) FROM details`, args...).Scan(&result.Total).Error; err != nil {
			return err
		}
		pageArgs := append(append([]any{}, args...), q.PageSize, (q.Page-1)*q.PageSize)
		if q.Export {
			if result.Total > MaxReportExportRows {
				return ErrReportExportTooLarge
			}
			result.Page = 1
			result.PageSize = int(result.Total)
			return tx.Raw(cte+` SELECT * FROM details ORDER BY submitted_at DESC NULLS LAST,id DESC`, args...).Scan(&result.Items).Error
		}
		return tx.Raw(cte+` SELECT * FROM details ORDER BY submitted_at DESC NULLS LAST,id DESC LIMIT ? OFFSET ?`, pageArgs...).Scan(&result.Items).Error
	}, &sql.TxOptions{Isolation: sql.LevelRepeatableRead, ReadOnly: true})
	return result, err
}
