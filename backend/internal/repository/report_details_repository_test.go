package repository

import (
	"context"
	"testing"

	"gorm.io/gorm"
	"renluyen-dlu-backend/internal/model"
)

// Runs inside the isolated TEMP-table transaction of TestReportAnalyticsPostgres.
func testReportDetailsFixtures(t *testing.T, tx *gorm.DB) {
	t.Helper()
	for _, statement := range []string{
		`INSERT INTO "User"(id,firstname,lastname) VALUES (104,'Student','Four'),(105,'Student','Five')`,
		`INSERT INTO activity_registration(id,idstudent,idactivity,status,registeredat) VALUES (11,5,2,1,'2026-08-04')`,
		`UPDATE evidence SET submitat='2026-08-02 23:59:59' WHERE id=10`,
		`UPDATE activity SET score=0 WHERE id=1`,
	} {
		if err := tx.Exec(statement).Error; err != nil {
			t.Fatal(err)
		}
	}
	q := model.ReportDetailQuery{Page: 1, PageSize: 10}
	repo := NewReportDetailsRepository(tx)
	r, err := repo.GetDetails(context.Background(), 1, "ADMIN", q)
	if err != nil {
		t.Fatal(err)
	}
	if r.Total != 6 || len(r.Items) != 6 || len(r.Classes) != 2 {
		t.Fatalf("details counts: %+v", r)
	}
	var latest, unsubmitted bool
	for _, row := range r.Items {
		if row.ID == 10 {
			latest = true
			if row.StudentID != "SV1" || row.StudentName != "Student One" || row.ClassName != "CT1" || row.ActivityScore == nil || *row.ActivityScore != 0 || row.EvidenceID == nil || *row.EvidenceID != 10 || row.Status == nil || *row.Status != 1 || row.SubmittedAt == nil || row.SubmittedAt.UTC().Hour() != 16 {
				t.Fatalf("incorrect row/timezone: %+v", row)
			}
		}
		if row.ID == 11 {
			unsubmitted = true
			if row.EvidenceID != nil || row.Status != nil || row.SubmittedAt != nil {
				t.Fatal("unsubmitted row must retain nulls")
			}
		}
	}
	if !latest || !unsubmitted {
		t.Fatal("deduplicated/latest or unsubmitted registration missing")
	}
	q.Search = "Student One"
	r, err = repo.GetDetails(context.Background(), 1, "ADMIN", q)
	if err != nil || r.Total != 2 {
		t.Fatalf("name search: %+v %v", r, err)
	}
	q.Search = "%"
	r, err = repo.GetDetails(context.Background(), 1, "ADMIN", q)
	if err != nil || r.Total != 0 {
		t.Fatalf("wildcard must be literal: %+v %v", r, err)
	}
	q.Search = ""
	q.ClassID = 2
	r, err = repo.GetDetails(context.Background(), 1, "ADMIN", q)
	if err != nil || r.Total != 1 {
		t.Fatalf("class filter: %+v %v", r, err)
	}
	q.FacultyID = 1
	r, err = repo.GetDetails(context.Background(), 1, "ADMIN", q)
	if err != nil || r.Total != 0 {
		t.Fatalf("combined incompatible filters: %+v %v", r, err)
	}
	q.FacultyID = 0
	q.MajorID = 2
	r, err = repo.GetDetails(context.Background(), 2, "STUDENT_AFFAIRS_ASSISTANT", q)
	if err != nil || r.Total != 0 || len(r.Classes) != 1 || r.Classes[0].FacultyID != 1 {
		t.Fatalf("out-of-scope class/options leak: %+v %v", r, err)
	}
	q = model.ReportDetailQuery{Page: 1, PageSize: 1}
	r, err = repo.GetDetails(context.Background(), 1, "ADMIN", q)
	if err != nil || r.Total != 6 || len(r.Items) != 1 {
		t.Fatalf("pagination: %+v %v", r, err)
	}
	firstID := r.Items[0].ID
	q.Export = true
	exported, exportErr := repo.GetDetails(context.Background(), 1, "ADMIN", q)
	if exportErr != nil || exported.Total != 6 || len(exported.Items) != 6 {
		t.Fatalf("export must ignore pagination: %+v %v", exported, exportErr)
	}
	q.ClassID = 2
	exported, exportErr = repo.GetDetails(context.Background(), 1, "ADMIN", q)
	if exportErr != nil || exported.Total != 1 || len(exported.Items) != 1 {
		t.Fatalf("filtered export: %+v %v", exported, exportErr)
	}
	exported, exportErr = repo.GetDetails(context.Background(), 2, "STUDENT_AFFAIRS_ASSISTANT", q)
	if exportErr != nil || exported.Total != 0 || len(exported.Items) != 0 {
		t.Fatalf("export scope leak: %+v %v", exported, exportErr)
	}
	q.ClassID = 0
	q.Export = false
	q.Page = 2
	r, err = repo.GetDetails(context.Background(), 1, "ADMIN", q)
	if err != nil || len(r.Items) != 1 || r.Items[0].ID == firstID {
		t.Fatalf("unstable pages: %+v %v", r, err)
	}
	q.Page = 99
	r, err = repo.GetDetails(context.Background(), 1, "ADMIN", q)
	if err != nil || r.Total != 6 || len(r.Items) != 0 {
		t.Fatalf("empty page: %+v %v", r, err)
	}
	if _, err = repo.GetDetails(context.Background(), 1, "STUDENT", q); err != ErrReportForbidden {
		t.Fatal("student must be forbidden")
	}
}
