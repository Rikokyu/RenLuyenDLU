package repository

import (
	"context"
	"errors"
	"time"

	"gorm.io/gorm"
	"renluyen-dlu-backend/internal/model"
)

var ErrReportForbidden = errors.New("report scope is unavailable")

type ReportRepository interface {
	GetReportOverview(context.Context, int64, string, model.ReportPeriod, model.ReportPeriod, time.Time) (*model.ReportOverview, error)
}

type reportRepository struct{ db *gorm.DB }

func NewReportRepository(db *gorm.DB) ReportRepository { return &reportRepository{db: db} }

func (r *reportRepository) GetReportOverview(ctx context.Context, userID int64, role string, period, previous model.ReportPeriod, now time.Time) (*model.ReportOverview, error) {
	if role != "ADMIN" && role != "STUDENT_AFFAIRS_ASSISTANT" {
		return nil, ErrReportForbidden
	}
	scope, err := (&dashboardRepository{db: r.db}).resolveDashboardScope(ctx, userID, role)
	if err != nil {
		return nil, err
	}
	studentPredicate := scope.studentPredicateOrTrue()
	activityPredicate := scope.activityPredicate
	if activityPredicate == "" {
		activityPredicate = "TRUE"
	}
	args := []any{period.FromDate, period.ToDate, previous.FromDate, previous.ToDate}
	args = append(args, scope.studentArgs...)
	args = append(args, now.In(time.FixedZone("ICT", 7*60*60)).Format("2006-01-02 15:04:05.999999"))
	args = append(args, scope.activityArgs...)
	// One statement gives both periods the same database snapshot. Collapse duplicate
	// student/event registrations before joining evidence so neither counts nor hours inflate.
	query := `WITH periods AS (
		SELECT 0 AS period_index, ?::date AS from_date, ?::date AS to_date
		UNION ALL SELECT 1, ?::date, ?::date
	), scoped_students AS (
		SELECT s.id FROM student s
		LEFT JOIN class c ON c.id = s.idclass
		LEFT JOIN major m ON m.id = c.idmajor
		WHERE ` + studentPredicate + `
	), events AS (
		SELECT p.period_index, a.id, a.timebegin, a.timeend,
			CASE WHEN u.idrole = 1 THEN 'school'
			WHEN u.idrole = 2 OR EXISTS (SELECT 1 FROM lecturer l WHERE l.iduser = a.iduser AND l.idfaculty IS NOT NULL)
			THEN 'faculty' ELSE 'unknown' END AS level
		FROM periods p JOIN activity a ON a.timeend >= p.from_date AND a.timeend < p.to_date + INTERVAL '1 day'
		LEFT JOIN "User" u ON u.id = a.iduser
		WHERE COALESCE(a.status, 0) <> 0 AND a.timeend <= ?::timestamp AND (` + activityPredicate + `)
	), registrations AS (
		SELECT DISTINCT ON (e.period_index, ar.idstudent, ar.idactivity)
			e.period_index, ar.idstudent, ar.id, e.timebegin, e.timeend
		FROM activity_registration ar
		JOIN events e ON e.id = ar.idactivity
		JOIN scoped_students s ON s.id = ar.idstudent
		WHERE COALESCE(ar.status, 0) = 1
		ORDER BY e.period_index, ar.idstudent, ar.idactivity, ar.registeredat DESC, ar.id DESC
	), attendance AS (
		SELECT r.*, COALESCE(latest.status = 1, FALSE) AS confirmed
		FROM registrations r LEFT JOIN LATERAL (
			SELECT ev.status FROM evidence ev WHERE ev.idacregis = r.id ORDER BY ev.id DESC LIMIT 1
		) latest ON TRUE
	)
	SELECT p.period_index,
		(SELECT COUNT(*) FROM scoped_students) AS total_students,
		(SELECT COUNT(DISTINCT idstudent) FROM attendance WHERE period_index = p.period_index AND confirmed) AS participating_students,
		(SELECT COUNT(*) FROM events WHERE period_index = p.period_index) AS organized_events,
		(SELECT COUNT(*) FROM events WHERE period_index = p.period_index AND level = 'school') AS school_events,
		(SELECT COUNT(*) FROM events WHERE period_index = p.period_index AND level = 'faculty') AS faculty_events,
		(SELECT COUNT(*) FROM events WHERE period_index = p.period_index AND level = 'unknown') AS unclassified_events,
		(SELECT COUNT(*) FROM attendance WHERE period_index = p.period_index) AS registrations,
		(SELECT COUNT(*) FROM attendance WHERE period_index = p.period_index AND confirmed) AS confirmed_participations,
		(SELECT COALESCE(SUM(GREATEST(EXTRACT(EPOCH FROM (timeend-timebegin))/3600.0, 0)), 0)
		 FROM attendance WHERE period_index = p.period_index AND confirmed) AS volunteer_hours
	FROM periods p ORDER BY p.period_index`
	var rows []struct {
		PeriodIndex         int
		model.ReportMetrics `gorm:"embedded"`
	}
	if err := r.db.WithContext(ctx).Raw(query, args...).Scan(&rows).Error; err != nil {
		return nil, err
	}
	result := &model.ReportOverview{ScopeName: scope.name, Period: period, PreviousPeriod: previous}
	for _, row := range rows {
		if row.PeriodIndex == 0 {
			result.Current = row.ReportMetrics
		} else {
			result.Previous = row.ReportMetrics
		}
	}
	return result, nil
}
