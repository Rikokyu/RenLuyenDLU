package repository

import (
	"context"
	"fmt"
	"strings"

	"renluyen-dlu-backend/internal/dto"

	"gorm.io/gorm"
)

type DashboardRepository interface {
	GetOverview(ctx context.Context, userID int64, role string) (*dto.DashboardOverview, error)
}

type dashboardRepository struct {
	db *gorm.DB
}

func NewDashboardRepository(db *gorm.DB) DashboardRepository {
	return &dashboardRepository{db: db}
}

type dashboardScope struct {
	name              string
	studentPredicate  string
	studentArgs       []any
	activityPredicate string
	activityArgs      []any
}

func (r *dashboardRepository) GetOverview(
	ctx context.Context,
	userID int64,
	role string,
) (*dto.DashboardOverview, error) {
	scope, err := r.resolveDashboardScope(ctx, userID, role)
	if err != nil {
		return nil, err
	}
	result := &dto.DashboardOverview{
		ScopeName:           scope.name,
		Activities:          []dto.DashboardActivity{},
		RecentRegistrations: []dto.DashboardEnrollment{},
		RecentEvidence:      []dto.DashboardEvidence{},
	}
	studentQuery := r.db.WithContext(ctx).Table(`student s`).
		Joins(`LEFT JOIN class c ON c.id = s.idclass`).
		Joins(`LEFT JOIN major m ON m.id = c.idmajor`)
	if scope.studentPredicate != "" {
		studentQuery = studentQuery.Where(scope.studentPredicate, scope.studentArgs...)
	}
	if err := studentQuery.Count(&result.TotalStudents).Error; err != nil {
		return nil, err
	}

	metrics := struct {
		ParticipatingStudents  int64 `gorm:"column:participating_students"`
		RegistrationCount      int64 `gorm:"column:registration_count"`
		PendingEvidence        int64 `gorm:"column:pending_evidence"`
		EligibleRegistrations  int64 `gorm:"column:eligible_registrations"`
		CompletedRegistrations int64 `gorm:"column:completed_registrations"`
	}{}
	query := r.db.WithContext(ctx).Table(`activity_registration ar`).
		Joins(`JOIN student s ON s.id = ar.idstudent`).
		Joins(`JOIN class c ON c.id = s.idclass`).
		Joins(`JOIN major m ON m.id = c.idmajor`).
		Joins(`JOIN activity a ON a.id = ar.idactivity`).
		Joins(`LEFT JOIN LATERAL (
			SELECT e.status
			FROM evidence e
			WHERE e.idacregis = ar.id
			ORDER BY e.id DESC
			LIMIT 1
		) latest_evidence ON TRUE`).
		Where(`COALESCE(ar.status, 0) = 1`)
	if scope.studentPredicate != "" {
		query = query.Where(scope.studentPredicate, scope.studentArgs...)
	}
	err = query.Select(`
		COUNT(DISTINCT s.id) AS participating_students,
		COUNT(DISTINCT ar.id) AS registration_count,
		COUNT(DISTINCT ar.id) FILTER (WHERE latest_evidence.status = 0) AS pending_evidence,
		COUNT(DISTINCT ar.id) FILTER (WHERE a.timeend <= NOW()) AS eligible_registrations,
		COUNT(DISTINCT ar.id) FILTER (WHERE a.timeend <= NOW() AND latest_evidence.status = 1) AS completed_registrations
	`).Scan(&metrics).Error
	if err != nil {
		return nil, err
	}
	result.ParticipatingStudents = metrics.ParticipatingStudents
	result.RegistrationCount = metrics.RegistrationCount
	result.PendingEvidence = metrics.PendingEvidence
	if metrics.EligibleRegistrations > 0 {
		result.CompletionRate = int((metrics.CompletedRegistrations*100 + metrics.EligibleRegistrations/2) / metrics.EligibleRegistrations)
	}

	activityQuery := r.db.WithContext(ctx).Table(`activity a`)
	if scope.activityPredicate != "" {
		activityQuery = activityQuery.Where(scope.activityPredicate, scope.activityArgs...)
	}
	var activityStats struct {
		ActivityCount       int64 `gorm:"column:activity_count"`
		CompletedActivities int64 `gorm:"column:completed_activities"`
		RunningActivities   int64 `gorm:"column:running_activities"`
		UpcomingActivities  int64 `gorm:"column:upcoming_activities"`
	}
	err = activityQuery.Select(`
		COUNT(*) FILTER (WHERE COALESCE(a.status, 0) <> 0) AS activity_count,
		COUNT(*) FILTER (WHERE COALESCE(a.status, 0) <> 0 AND a.timeend <= NOW()) AS completed_activities,
		COUNT(*) FILTER (WHERE COALESCE(a.status, 0) <> 0 AND a.timebegin <= NOW() AND a.timeend > NOW()) AS running_activities,
		COUNT(*) FILTER (WHERE COALESCE(a.status, 0) <> 0 AND a.timebegin > NOW()) AS upcoming_activities
	`).Scan(&activityStats).Error
	if err != nil {
		return nil, err
	}
	result.ActivityCount = activityStats.ActivityCount
	result.CompletedActivities = activityStats.CompletedActivities
	result.RunningActivities = activityStats.RunningActivities
	result.UpcomingActivities = activityStats.UpcomingActivities

	activityListQuery := r.db.WithContext(ctx).Table(`activity a`).
		Joins(`LEFT JOIN activity_registration ar ON ar.idactivity = a.id AND COALESCE(ar.status, 0) = 1`).
		Joins(`LEFT JOIN student s ON s.id = ar.idstudent`).
		Joins(`LEFT JOIN class c ON c.id = s.idclass`).
		Joins(`LEFT JOIN major m ON m.id = c.idmajor`).
		Where(`COALESCE(a.status, 0) <> 0`)
	if scope.activityPredicate != "" {
		activityListQuery = activityListQuery.Where(scope.activityPredicate, scope.activityArgs...)
	}
	selectActivities := `
		a.id,
		a.activity_code,
		a.title,
		a.timebegin AS time_begin,
		a.timeend AS time_end,
		COALESCE(a.slot, 0) AS slot,
		COUNT(DISTINCT ar.id) FILTER (WHERE ` + scope.studentPredicateOrTrue() + `) AS registered_count,
		COALESCE(a.score, 0) AS score,
		COALESCE(a.status, 0) AS status
	`
	err = activityListQuery.Select(selectActivities, scope.studentArgs...).
		Group(`a.id`).
		Order(`a.timebegin ASC, a.id ASC`).
		Scan(&result.Activities).Error
	if err != nil {
		return nil, err
	}

	feedQuery := r.db.WithContext(ctx).Table(`activity_registration ar`).
		Select(`
			CONCAT_WS(' ', u.firstname, u.lastname) AS student_name,
			COALESCE(s.student_code, '') AS student_id,
			a.id AS activity_id,
			a.title AS activity,
			ar.registeredat AS registered
		`).
		Joins(`JOIN student s ON s.id = ar.idstudent`).
		Joins(`JOIN "User" u ON u.id = s.iduser`).
		Joins(`JOIN class c ON c.id = s.idclass`).
		Joins(`JOIN major m ON m.id = c.idmajor`).
		Joins(`JOIN activity a ON a.id = ar.idactivity`).
		Where(`COALESCE(ar.status, 0) = 1`)
	if scope.studentPredicate != "" {
		feedQuery = feedQuery.Where(scope.studentPredicate, scope.studentArgs...)
	}
	err = feedQuery.Order(`ar.registeredat DESC, ar.id DESC`).Limit(10).Scan(&result.RecentRegistrations).Error
	if err != nil {
		return nil, err
	}

	evidenceQuery := r.db.WithContext(ctx).Table(`evidence e`).
		Select(`
			CONCAT_WS(' ', u.firstname, u.lastname) AS student_name,
			COALESCE(s.student_code, '') AS student_id,
			a.id AS activity_id,
			a.title AS activity,
			e.status,
			e.submitat AS submitted_at
		`).
		Joins(`JOIN activity_registration ar ON ar.id = e.idacregis`).
		Joins(`JOIN student s ON s.id = ar.idstudent`).
		Joins(`JOIN "User" u ON u.id = s.iduser`).
		Joins(`JOIN class c ON c.id = s.idclass`).
		Joins(`JOIN major m ON m.id = c.idmajor`).
		Joins(`JOIN activity a ON a.id = ar.idactivity`)
	if scope.studentPredicate != "" {
		evidenceQuery = evidenceQuery.Where(scope.studentPredicate, scope.studentArgs...)
	}
	err = evidenceQuery.Order(`e.submitat DESC NULLS LAST, e.id DESC`).Limit(10).Scan(&result.RecentEvidence).Error
	if err != nil {
		return nil, err
	}
	return result, nil
}

func (r *dashboardRepository) resolveDashboardScope(
	ctx context.Context,
	userID int64,
	role string,
) (dashboardScope, error) {
	switch role {
	case "ADMIN":
		return dashboardScope{name: "Toàn trường"}, nil
	case "STUDENT_AFFAIRS_ASSISTANT":
		var assignment struct {
			Name      string `gorm:"column:name"`
			FacultyID int64  `gorm:"column:faculty_id"`
		}
		err := r.db.WithContext(ctx).Table(`"User" u`).
			Select(`f.name AS name, f.id AS faculty_id`).
			Joins(`LEFT JOIN lecturer l ON l.iduser = u.id`).
			Joins(`LEFT JOIN faculty f ON
				lower(trim(f.name)) = lower(trim(u.responsiblefaculty))
				OR lower(trim(f.faculty_code)) = lower(trim(u.responsiblefaculty))
				OR f.id = l.idfaculty`).
			Where(`u.id = ?`, userID).
			Limit(1).
			Scan(&assignment).Error
		if err != nil {
			return dashboardScope{}, err
		}
		if assignment.FacultyID == 0 {
			var email string
			if err := r.db.WithContext(ctx).Table(`"User"`).
				Select(`email`).
				Where(`id = ?`, userID).
				Scan(&email).Error; err != nil {
				return dashboardScope{}, err
			}
			if facultyCode := seededAssistantFacultyCode(email); facultyCode != "" {
				err = r.db.WithContext(ctx).Table(`faculty`).
					Select(`name, id AS faculty_id`).
					Where(`upper(faculty_code) = ?`, facultyCode).
					Limit(1).
					Scan(&assignment).Error
				if err != nil {
					return dashboardScope{}, err
				}
			}
		}
		if assignment.FacultyID == 0 {
			return dashboardScope{}, fmt.Errorf("không tìm thấy khoa được phân công cho tài khoản trợ lý")
		}
		return dashboardScope{
			name:             assignment.Name,
			studentPredicate: `m.idfaculty = ?`,
			studentArgs:      []any{assignment.FacultyID},
			activityPredicate: `(a.iduser = ? OR EXISTS (
				SELECT 1 FROM lecturer l
				WHERE l.iduser = a.iduser AND l.idfaculty = ?
			) OR EXISTS (
				SELECT 1 FROM activity_registration ar2
				JOIN student s2 ON s2.id = ar2.idstudent
				JOIN class c2 ON c2.id = s2.idclass
				JOIN major m2 ON m2.id = c2.idmajor
				WHERE ar2.idactivity = a.id AND COALESCE(ar2.status, 0) = 1 AND m2.idfaculty = ?
			))`,
			activityArgs: []any{userID, assignment.FacultyID, assignment.FacultyID},
		}, nil
	case "HOMEROOM_TEACHER":
		var assignment struct {
			ID   int64  `gorm:"column:id"`
			Code string `gorm:"column:class_code"`
		}
		err := r.db.WithContext(ctx).Table(`lecturer l`).
			Select(`c.id, c.class_code`).
			Joins(`JOIN class c ON c.idlecturer = l.id`).
			Where(`l.iduser = ?`, userID).
			Order(`c.class_code`).
			Limit(1).
			Scan(&assignment).Error
		if err != nil {
			return dashboardScope{}, err
		}
		if assignment.ID == 0 {
			return dashboardScope{}, fmt.Errorf("giảng viên chưa được phân công lớp")
		}
		return dashboardScope{
			name:             assignment.Code,
			studentPredicate: `s.idclass = ?`,
			studentArgs:      []any{assignment.ID},
			activityPredicate: `(a.iduser = ? OR EXISTS (
				SELECT 1 FROM activity_registration ar2
				JOIN student s2 ON s2.id = ar2.idstudent
				WHERE ar2.idactivity = a.id AND COALESCE(ar2.status, 0) = 1 AND s2.idclass = ?
			))`,
			activityArgs: []any{userID, assignment.ID},
		}, nil
	case "CLASS_OFFICER":
		var assignment struct {
			ID   int64  `gorm:"column:id"`
			Code string `gorm:"column:class_code"`
		}
		err := r.db.WithContext(ctx).Table(`student s`).
			Select(`c.id, c.class_code`).
			Joins(`JOIN class c ON c.id = s.idclass`).
			Where(`s.iduser = ?`, userID).
			Limit(1).
			Scan(&assignment).Error
		if err != nil {
			return dashboardScope{}, err
		}
		if assignment.ID == 0 {
			return dashboardScope{}, fmt.Errorf("cán sự chưa được phân công lớp")
		}
		return dashboardScope{
			name:             assignment.Code,
			studentPredicate: `s.idclass = ?`,
			studentArgs:      []any{assignment.ID},
			activityPredicate: `EXISTS (
				SELECT 1 FROM activity_registration ar2
				JOIN student s2 ON s2.id = ar2.idstudent
				WHERE ar2.idactivity = a.id AND COALESCE(ar2.status, 0) = 1 AND s2.idclass = ?
			)`,
			activityArgs: []any{assignment.ID},
		}, nil
	default:
		return dashboardScope{}, fmt.Errorf("vai trò %s không có dashboard tổng quan", role)
	}
}

func seededAssistantFacultyCode(email string) string {
	username := strings.ToLower(strings.TrimSpace(strings.SplitN(email, "@", 2)[0]))
	return map[string]string{
		"hieunt":  "CT",
		"phattv":  "KT",
		"chault":  "AV",
		"baopq":   "QT",
		"maivt":   "DL",
		"annv":    "KC",
		"hanhtt":  "LU",
		"quanglm": "SP",
		"longdh":  "TC",
		"tungbt":  "XH",
	}[username]
}

func (s dashboardScope) studentPredicateOrTrue() string {
	if s.studentPredicate == "" {
		return "TRUE"
	}
	return s.studentPredicate
}
