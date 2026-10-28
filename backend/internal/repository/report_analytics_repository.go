package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"math"
	"time"

	"gorm.io/gorm"
	"renluyen-dlu-backend/internal/model"
)

var ErrReportSemesterNotFound = errors.New("report semester not found")

type ReportAnalyticsRepository interface {
	GetAnalytics(context.Context, int64, string, model.ReportAnalyticsQuery, time.Time) (*model.ReportAnalytics, error)
}

type reportAnalyticsRepository struct{ db *gorm.DB }

func NewReportAnalyticsRepository(db *gorm.DB) ReportAnalyticsRepository {
	return &reportAnalyticsRepository{db: db}
}

func analyticsPercent(n, d int64) *float64 {
	if d == 0 {
		return nil
	}
	v := math.Round(float64(n)*1000/float64(d)) / 10
	return &v
}

func (r *reportAnalyticsRepository) GetAnalytics(ctx context.Context, userID int64, role string, q model.ReportAnalyticsQuery, now time.Time) (*model.ReportAnalytics, error) {
	if role != "ADMIN" && role != "STUDENT_AFFAIRS_ASSISTANT" {
		return nil, ErrReportForbidden
	}
	result := &model.ReportAnalytics{Period: q.Period, Page: q.Page, PageSize: q.PageSize, Semesters: []model.ReportSemester{}, Events: []model.ReportEventConversion{}, TopStudents: []model.ReportTopStudent{}, AttendanceBasis: "latest_approved_evidence"}
	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		scope, err := (&dashboardRepository{db: tx}).resolveDashboardScope(ctx, userID, role)
		if err != nil {
			return err
		}
		result.ScopeName = scope.name
		if err := tx.Table("school_year").Order("year DESC, semester DESC, id DESC").Find(&result.Semesters).Error; err != nil {
			return err
		}
		start, err := time.Parse(time.DateOnly, q.Period.FromDate)
		if err != nil {
			return err
		}
		year, semester := start.Year(), 1
		if start.Month() < time.February {
			year--
		} else if start.Month() < time.August {
			year--
			semester = 2
		}
		academicYear := fmt.Sprintf("%d-%d", year, year+1)
		for i := range result.Semesters {
			s := &result.Semesters[i]
			if (q.SchoolYearID > 0 && s.ID == q.SchoolYearID) || (q.SchoolYearID == 0 && s.Year == academicYear && s.Semester == semester) {
				result.Scores.Semester = s
				break
			}
		}
		if q.SchoolYearID > 0 && result.Scores.Semester == nil {
			return ErrReportSemesterNotFound
		}
		selectedID := int64(0)
		if result.Scores.Semester != nil {
			selectedID = result.Scores.Semester.ID
		}
		studentsCTE := `WITH scoped_students AS (
		 SELECT s.id, s.student_code, s.iduser, c.class_code, m.idfaculty
		 FROM student s LEFT JOIN class c ON c.id=s.idclass LEFT JOIN major m ON m.id=c.idmajor
		 WHERE ` + scope.studentPredicateOrTrue() + `)`
		scoreArgs := append([]any{}, scope.studentArgs...)
		scoreArgs = append(scoreArgs, selectedID)
		var scores []struct {
			Score  *int
			Status *int
		}
		if err := tx.Raw(studentsCTE+` SELECT latest.lastscore AS score, latest.status FROM scoped_students s LEFT JOIN LATERAL (
		 SELECT tp.lastscore, tp.status FROM trainingpoint tp WHERE tp.idstudent=s.id AND tp.idyear=? ORDER BY tp.id DESC LIMIT 1
		) latest ON TRUE`, scoreArgs...).Scan(&scores).Error; err != nil {
			return err
		}
		result.Scores.Bands = []model.ReportScoreBand{
			{Key: "excellent", Label: "Xuất sắc (90–100đ)"}, {Key: "good", Label: "Tốt (80–89đ)"}, {Key: "fair", Label: "Khá (65–79đ)"}, {Key: "average", Label: "Trung bình (50–64đ)"}, {Key: "weak", Label: "Yếu/Kém (<50đ)"},
		}
		for _, row := range scores {
			result.Scores.TotalStudents++
			if row.Score == nil || row.Status == nil || *row.Status != 1 {
				result.Scores.UngradedStudents++
				continue
			}
			if *row.Score < 0 || *row.Score > 100 {
				result.Scores.InvalidScores++
				continue
			}
			result.Scores.GradedStudents++
			idx := 4
			switch {
			case *row.Score >= 90:
				idx = 0
			case *row.Score >= 80:
				idx = 1
			case *row.Score >= 65:
				idx = 2
			case *row.Score >= 50:
				idx = 3
			}
			result.Scores.Bands[idx].Count++
		}
		for i := range result.Scores.Bands {
			b := &result.Scores.Bands[i]
			b.Percentage = analyticsPercent(b.Count, result.Scores.GradedStudents)
		}
		activityPredicate := scope.activityPredicate
		if activityPredicate == "" {
			activityPredicate = "TRUE"
		}
		args := append([]any{}, scope.studentArgs...)
		args = append(args, q.Period.FromDate, q.Period.ToDate, now.In(time.FixedZone("ICT", 7*3600)).Format("2006-01-02 15:04:05.999999"))
		args = append(args, scope.activityArgs...)
		cte := studentsCTE + `, events AS (
		 SELECT a.id,a.activity_code,a.title,a.timebegin,a.timeend FROM activity a
		 WHERE COALESCE(a.status,0)<>0 AND a.timeend>=?::date AND a.timeend< ?::date+INTERVAL '1 day' AND a.timeend<=?::timestamp AND (` + activityPredicate + `)
		), registrations AS (
		 SELECT DISTINCT ON (ar.idstudent,ar.idactivity) ar.id,ar.idstudent,ar.idactivity
		 FROM activity_registration ar JOIN events e ON e.id=ar.idactivity JOIN scoped_students s ON s.id=ar.idstudent
		 WHERE COALESCE(ar.status,0)=1 ORDER BY ar.idstudent,ar.idactivity,ar.registeredat DESC,ar.id DESC
		), attendance AS (
		 SELECT r.*, COALESCE(latest.status=1,FALSE) AS confirmed, COALESCE(latest.status IN (0,3),FALSE) AS pending
		 FROM registrations r LEFT JOIN LATERAL (SELECT ev.status FROM evidence ev WHERE ev.idacregis=r.id ORDER BY ev.id DESC LIMIT 1) latest ON TRUE
		), conversions AS (
		 SELECT e.id,e.activity_code AS code,e.title,COUNT(a.id) AS registered,
		 COUNT(a.id) FILTER (WHERE a.confirmed) AS attended, COUNT(a.id) FILTER (WHERE a.pending) AS pending,
		 COUNT(a.id) FILTER (WHERE NOT a.confirmed) AS no_show
		 FROM events e LEFT JOIN attendance a ON a.idactivity=e.id GROUP BY e.id,e.activity_code,e.title
		)`
		if err := tx.Raw(cte+` SELECT COUNT(*) FROM events`, args...).Scan(&result.EventTotal).Error; err != nil {
			return err
		}
		order := map[string]string{"attended": "attended DESC, registered DESC, id ASC", "no_show": "(no_show::numeric/NULLIF(registered,0)) DESC NULLS LAST, registered DESC, id ASC", "registered": "registered DESC, attended DESC, id ASC"}[q.Sort]
		if order == "" {
			return fmt.Errorf("invalid event sort")
		}
		pageArgs := append(append([]any{}, args...), q.PageSize, (q.Page-1)*q.PageSize)
		if err := tx.Raw(cte+` SELECT * FROM conversions ORDER BY `+order+` LIMIT ? OFFSET ?`, pageArgs...).Scan(&result.Events).Error; err != nil {
			return err
		}
		for i := range result.Events {
			e := &result.Events[i]
			e.CheckInRate = analyticsPercent(e.Attended, e.Registered)
			e.NoShowRate = analyticsPercent(e.NoShow, e.Registered)
		}
		topArgs := append(append([]any{}, args...), q.TopLimit)
		if err := tx.Raw(cte+` SELECT s.id,s.student_code,COALESCE(CONCAT_WS(' ',u.firstname,u.lastname),'') AS name,
		 COALESCE(f.name,'Chưa xác định') AS faculty, COALESCE(s.class_code,'') AS class_code,COUNT(*) AS events,
		 ROUND(SUM(GREATEST(EXTRACT(EPOCH FROM(e.timeend-e.timebegin))/3600.0,0)),2) AS hours
		 FROM attendance a JOIN scoped_students s ON s.id=a.idstudent JOIN events e ON e.id=a.idactivity
		 LEFT JOIN "User" u ON u.id=s.iduser LEFT JOIN faculty f ON f.id=s.idfaculty WHERE a.confirmed
		 GROUP BY s.id,s.student_code,u.firstname,u.lastname,f.name,s.class_code
		 ORDER BY events DESC,hours DESC,s.id ASC LIMIT ?`, topArgs...).Scan(&result.TopStudents).Error; err != nil {
			return err
		}
		for i := range result.TopStudents {
			result.TopStudents[i].Rank = i + 1
		}
		return nil
	}, &sql.TxOptions{Isolation: sql.LevelRepeatableRead, ReadOnly: true})
	return result, err
}
