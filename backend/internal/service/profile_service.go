package service

import (
	"context"
	"fmt"
)

type Profile struct {
	User          AuthUser          `json:"user"`
	TrainingScore int               `json:"trainingScore"`
	TrainingRank  string            `json:"trainingRank"`
	Activities    []ProfileActivity `json:"activities"`
}

type ProfileActivity struct {
	Title      string `json:"title" gorm:"column:title"`
	Category   string `json:"category" gorm:"column:category"`
	Registered string `json:"registeredAt" gorm:"column:registered_at"`
	Score      int    `json:"score" gorm:"column:score"`
	Evidence   string `json:"evidenceStatus" gorm:"column:evidence_status"`
	Attendance string `json:"attendance" gorm:"column:attendance"`
}

func (s *authService) GetProfile(ctx context.Context, userID int64) (Profile, error) {
	var user AuthUser
	if err := s.userQuery(ctx).Where(`u.id = ?`, userID).Limit(1).Scan(&user).Error; err != nil {
		return Profile{}, err
	}
	if user.ID == 0 {
		return Profile{}, fmt.Errorf("không tìm thấy hồ sơ người dùng")
	}
	user.Permissions = permissionsForRole(user.Role)

	profile := Profile{
		User:       user,
		Activities: []ProfileActivity{},
	}
	if user.StudentID == "" {
		return profile, nil
	}

	if err := s.db.WithContext(ctx).Raw(`
		SELECT COALESCE(tp.lastscore, 0)
		FROM student s
		LEFT JOIN trainingpoint tp ON tp.idstudent = s.id
		LEFT JOIN school_year sy ON sy.id = tp.idyear
		WHERE s.iduser = ?
		ORDER BY sy.year DESC NULLS LAST, sy.semester DESC NULLS LAST, tp.id DESC NULLS LAST
		LIMIT 1
	`, userID).Scan(&profile.TrainingScore).Error; err != nil {
		return Profile{}, err
	}
	switch {
	case profile.TrainingScore >= 90:
		profile.TrainingRank = "Xuất sắc"
	case profile.TrainingScore >= 80:
		profile.TrainingRank = "Tốt"
	case profile.TrainingScore >= 65:
		profile.TrainingRank = "Khá"
	case profile.TrainingScore >= 50:
		profile.TrainingRank = "Trung bình"
	default:
		profile.TrainingRank = "Chưa có điểm"
	}

	err := s.db.WithContext(ctx).Raw(`
		SELECT
			a.title,
			COALESCE(a.detail, '') AS category,
			to_char(ar.registeredat, 'DD/MM/YYYY HH24:MI') AS registered_at,
			COALESCE(a.score, 0) AS score,
			CASE
				WHEN e.status = 1 THEN 'Đã duyệt'
				WHEN e.status = 2 THEN 'Đã từ chối'
				WHEN e.id IS NOT NULL THEN 'Chờ duyệt'
				ELSE 'Chưa nộp'
			END AS evidence_status,
			CASE WHEN ar.status = 1 THEN 'Đã điểm danh' ELSE 'Chưa điểm danh' END AS attendance
		FROM student s
		JOIN activity_registration ar ON ar.idstudent = s.id
		JOIN activity a ON a.id = ar.idactivity
		LEFT JOIN evidence e ON e.idacregis = ar.id
		WHERE s.iduser = ?
		ORDER BY ar.registeredat DESC
	`, userID).Scan(&profile.Activities).Error
	if profile.Activities == nil {
		profile.Activities = []ProfileActivity{}
	}
	return profile, err
}
