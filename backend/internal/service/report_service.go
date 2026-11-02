package service

import (
	"fmt"
	"math"
	"time"

	"renluyen-dlu-backend/internal/model"
)

// Activity timestamps are local wall-clock times in the existing PostgreSQL schema.
var reportLocation = time.FixedZone("Asia/Ho_Chi_Minh", 7*60*60)

// Default: academic semester (February–July or August–January).
// Custom ranges compare against the immediately preceding, equally long range.
func ResolveReportPeriods(from, to string, now time.Time) (model.ReportPeriod, model.ReportPeriod, error) {
	var start, end, previousStart, previousEnd time.Time
	if from == "" && to == "" {
		now = now.In(reportLocation)
		year, month, _ := now.Date()
		startMonth := time.August
		if month < time.February {
			year--
		} else if month < time.August {
			startMonth = time.February
		}
		start = time.Date(year, startMonth, 1, 0, 0, 0, 0, reportLocation)
		end = start.AddDate(0, 6, -1)
		previousStart = start.AddDate(0, -6, 0)
		previousEnd = start.AddDate(0, 0, -1)
	} else {
		var err error
		start, err = time.ParseInLocation(time.DateOnly, from, reportLocation)
		if err != nil {
			return model.ReportPeriod{}, model.ReportPeriod{}, fmt.Errorf("from_date phải có định dạng YYYY-MM-DD")
		}
		end, err = time.ParseInLocation(time.DateOnly, to, reportLocation)
		if err != nil {
			return model.ReportPeriod{}, model.ReportPeriod{}, fmt.Errorf("to_date phải có định dạng YYYY-MM-DD")
		}
		if end.Before(start) || end.Sub(start) > 365*24*time.Hour {
			return model.ReportPeriod{}, model.ReportPeriod{}, fmt.Errorf("khoảng ngày phải tăng dần và không quá 366 ngày")
		}
		days := int(end.Sub(start).Hours()/24) + 1
		previousStart = start.AddDate(0, 0, -days)
		previousEnd = start.AddDate(0, 0, -1)
	}
	period := func(a, b time.Time) model.ReportPeriod {
		return model.ReportPeriod{FromDate: a.Format(time.DateOnly), ToDate: b.Format(time.DateOnly)}
	}
	return period(start, end), period(previousStart, previousEnd), nil
}

func reportRatio(numerator, denominator float64) *float64 {
	if denominator == 0 {
		return nil
	}
	v := math.Round(numerator/denominator*1000) / 10
	return &v
}

func CompleteReportOverview(result *model.ReportOverview) {
	for _, m := range []*model.ReportMetrics{&result.Current, &result.Previous} {
		m.ParticipationRate = reportRatio(float64(m.ParticipatingStudents), float64(m.TotalStudents))
		m.CheckInRate = reportRatio(float64(m.ConfirmedParticipations), float64(m.Registrations))
		m.VolunteerHours = math.Round(m.VolunteerHours*100) / 100
	}
	a, b := result.Current, result.Previous
	result.Changes.ParticipatingStudentsPercent = reportRatio(float64(a.ParticipatingStudents-b.ParticipatingStudents), float64(b.ParticipatingStudents))
	result.Changes.OrganizedEvents = a.OrganizedEvents - b.OrganizedEvents
	result.Changes.VolunteerHoursPercent = reportRatio(a.VolunteerHours-b.VolunteerHours, b.VolunteerHours)
	if a.CheckInRate != nil && b.CheckInRate != nil {
		delta := math.Round((*a.CheckInRate-*b.CheckInRate)*10) / 10
		result.Changes.CheckInPercentagePoints = &delta
	}
	result.AttendanceBasis = "latest_approved_evidence"
	result.HoursBasis = "activity_duration_per_confirmed_student"
}
