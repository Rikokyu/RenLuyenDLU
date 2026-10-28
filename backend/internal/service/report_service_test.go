package service

import (
	"renluyen-dlu-backend/internal/model"
	"testing"
	"time"
)

func TestReportPeriods(t *testing.T) {
	for _, tc := range []struct{ now, from, to, wantFrom, wantTo, prevFrom, prevTo string }{
		{"2026-10-21", "", "", "2026-08-01", "2027-01-31", "2026-02-01", "2026-07-31"},
		{"2026-01-01", "", "", "2025-08-01", "2026-01-31", "2025-02-01", "2025-07-31"},
		{"2026-02-01", "", "", "2026-02-01", "2026-07-31", "2025-08-01", "2026-01-31"},
		{"2026-10-21", "2024-02-28", "2024-03-01", "2024-02-28", "2024-03-01", "2024-02-25", "2024-02-27"},
	} {
		now, _ := time.Parse(time.DateOnly, tc.now)
		p, prev, err := ResolveReportPeriods(tc.from, tc.to, now)
		if err != nil || p.FromDate != tc.wantFrom || p.ToDate != tc.wantTo || prev.FromDate != tc.prevFrom || prev.ToDate != tc.prevTo {
			t.Fatalf("%+v: got %+v %+v, %v", tc, p, prev, err)
		}
	}
	for _, tc := range [][2]string{{"bad", "2026-01-01"}, {"2026-02-30", "2026-03-01"}, {"2026-01-01", ""}, {"", "2026-01-01"}, {"2026-02-01", "2026-01-01"}, {"2024-01-01", "2026-01-01"}} {
		if _, _, err := ResolveReportPeriods(tc[0], tc[1], time.Now()); err == nil {
			t.Fatalf("accepted invalid range %v", tc)
		}
	}
}

func TestReportChangesAndEmptyDenominators(t *testing.T) {
	r := &model.ReportOverview{}
	CompleteReportOverview(r)
	if r.Current.CheckInRate != nil || r.Current.ParticipationRate != nil || r.Changes.VolunteerHoursPercent != nil || r.Changes.CheckInPercentagePoints != nil {
		t.Fatal("empty data must not imply a measurable percentage")
	}
	r.Current = model.ReportMetrics{TotalStudents: 10, ParticipatingStudents: 3, Registrations: 4, ConfirmedParticipations: 3, OrganizedEvents: 2, VolunteerHours: 12}
	r.Previous = model.ReportMetrics{TotalStudents: 10, ParticipatingStudents: 2, Registrations: 2, ConfirmedParticipations: 2, OrganizedEvents: 3, VolunteerHours: 24}
	CompleteReportOverview(r)
	if *r.Current.ParticipationRate != 30 || *r.Current.CheckInRate != 75 || *r.Changes.ParticipatingStudentsPercent != 50 || *r.Changes.CheckInPercentagePoints != -25 || r.Changes.OrganizedEvents != -1 || *r.Changes.VolunteerHoursPercent != -50 {
		t.Fatalf("incorrect metrics: %+v", r)
	}
}
