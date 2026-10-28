package repository

import (
	"context"
	"os"
	"testing"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"renluyen-dlu-backend/internal/model"
)

func TestReportAnalyticsPostgres(t *testing.T) {
	dsn := os.Getenv("TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("set TEST_DATABASE_URL for PostgreSQL integration tests")
	}
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Fatal(err)
	}
	now := time.Date(2026, 10, 22, 0, 0, 0, 0, time.UTC)
	q := model.ReportAnalyticsQuery{Period: model.ReportPeriod{FromDate: "2026-08-01", ToDate: "2026-08-31"}, Page: 1, PageSize: 5, TopLimit: 5, Sort: "attended"}
	// Read-only execution against actual schema, followed by isolated rollback fixtures.
	live, err := NewReportAnalyticsRepository(db).GetAnalytics(context.Background(), 1, "ADMIN", q, now)
	if err != nil {
		t.Fatalf("live database query: %v", err)
	}
	t.Logf("live schema: semesters=%d students=%d events=%d", len(live.Semesters), live.Scores.TotalStudents, live.EventTotal)
	liveDetails, err := NewReportDetailsRepository(db).GetDetails(context.Background(), 1, "ADMIN", model.ReportDetailQuery{Page: 1, PageSize: 10})
	if err != nil {
		t.Fatalf("live details schema: %v", err)
	}
	t.Logf("live details: rows=%d class options=%d", liveDetails.Total, len(liveDetails.Classes))
	tx := db.Begin()
	if tx.Error != nil {
		t.Fatal(tx.Error)
	}
	defer tx.Rollback()
	for _, table := range []string{`"User"`, "faculty", "lecturer", "major", "class", "student", "school_year", "trainingpoint", "activity", "activity_registration", "evidence"} {
		if err := tx.Exec(`CREATE TEMP TABLE ` + table + ` ON COMMIT DROP AS SELECT * FROM public.` + table + ` WITH NO DATA`).Error; err != nil {
			t.Fatal(err)
		}
	}
	statements := []string{
		`INSERT INTO "User"(id,idrole,responsiblefaculty,email,firstname,lastname) VALUES (1,1,'','a','Admin','A'),(2,2,'CT','b','Assistant','B'),(3,2,'KT','c','Assistant','C'),(101,3,'','s1','Student','One'),(102,3,'','s2','Student','Two'),(103,3,'','s3','Student','Three')`,
		`INSERT INTO faculty(id,name,faculty_code) VALUES (1,'CNTT','CT'),(2,'Kinh tế','KT')`,
		`INSERT INTO major(id,idfaculty) VALUES (1,1),(2,2)`,
		`INSERT INTO class(id,idmajor,class_code) VALUES (1,1,'CT1'),(2,2,'KT1')`,
		`INSERT INTO student(id,student_code,idclass,iduser) SELECT i, 'SV'||i, CASE WHEN i=3 THEN 2 ELSE 1 END,100+i FROM generate_series(1,13) i`,
		`INSERT INTO school_year(id,year,semester) VALUES (1,'2026-2027',1),(2,'2026-2027',2),(3,'2025-2026',1)`,
		`INSERT INTO trainingpoint(id,idstudent,idyear,lastscore,status) VALUES
		 (1,1,1,0,1),(2,2,1,49,1),(3,3,1,50,1),(4,4,1,64,1),(5,5,1,65,1),(6,6,1,79,1),(7,7,1,80,1),(8,8,1,89,1),(9,9,1,90,1),(10,10,1,100,1),(11,11,1,101,1),(12,12,1,85,0),
		 (0,1,1,100,1),(20,1,2,95,1)`,
		`INSERT INTO activity(id,activity_code,title,timebegin,timeend,status,iduser) VALUES
		 (1,'A1','First','2026-08-02 08:00','2026-08-02 10:00',1,1),
		 (2,'A2','Second','2026-08-03 08:00','2026-08-03 11:00',1,2),
		 (3,'A3','Cancelled','2026-08-03 08:00','2026-08-03 11:00',0,2),
		 (4,'A4','Empty','2026-08-31 23:00','2026-08-31 23:59:59',1,1),
		 (5,'A5','Out of range','2026-09-01 00:00','2026-09-01 01:00',1,1),
		 (6,'A6','Future','2027-01-01 00:00','2027-01-01 01:00',1,1)`,
		`INSERT INTO activity_registration(id,idstudent,idactivity,status,registeredat) VALUES
		 (1,1,1,1,'2026-08-01'),(2,2,1,1,'2026-08-01'),(3,3,1,1,'2026-08-01'),(4,4,1,1,'2026-08-01'),(5,1,2,1,'2026-08-01'),(6,2,2,0,'2026-08-01'),(7,1,3,1,'2026-08-01'),(10,1,1,1,'2026-08-02')`,
		`INSERT INTO evidence(id,idacregis,status,data) VALUES (1,1,1,'a'),(2,2,1,'b'),(3,2,2,'new rejected'),(4,3,1,'outside faculty'),(5,4,0,'pending'),(6,5,1,'approved'),(7,6,1,'cancelled registration'),(8,7,1,'cancelled event'),(9,10,1,'latest registration'),(10,10,1,'duplicate evidence')`,
	}
	for _, s := range statements {
		if err := tx.Exec(s).Error; err != nil {
			t.Fatal(err)
		}
	}
	repo := NewReportAnalyticsRepository(tx)
	r, err := repo.GetAnalytics(context.Background(), 1, "ADMIN", q, now)
	if err != nil {
		t.Fatal(err)
	}
	if r.Scores.Semester.ID != 1 || r.Scores.TotalStudents != 13 || r.Scores.GradedStudents != 10 || r.Scores.UngradedStudents != 2 || r.Scores.InvalidScores != 1 {
		t.Fatalf("wrong score summary: %+v", r.Scores)
	}
	for _, band := range r.Scores.Bands {
		if band.Count != 2 || band.Percentage == nil || *band.Percentage != 20 {
			t.Fatalf("score boundaries/duplicates: %+v", band)
		}
	}
	if r.EventTotal != 3 || len(r.Events) != 3 {
		t.Fatalf("event filters: %+v", r.Events)
	}
	e := r.Events[0]
	if e.ID != 1 || e.Registered != 4 || e.Attended != 2 || e.NoShow != 2 || e.Pending != 1 || *e.NoShowRate != 50 || *e.CheckInRate != 50 {
		t.Fatalf("conversion dedup: %+v", e)
	}
	if r.Events[2].Registered != 0 || r.Events[2].CheckInRate != nil || r.Events[2].NoShowRate != nil {
		t.Fatal("empty registration denominator")
	}
	if len(r.TopStudents) != 2 || r.TopStudents[0].ID != 1 || r.TopStudents[0].Events != 2 || r.TopStudents[0].Hours != 5 || r.TopStudents[1].ID != 3 {
		t.Fatalf("top ranking: %+v", r.TopStudents)
	}
	r, err = repo.GetAnalytics(context.Background(), 2, "STUDENT_AFFAIRS_ASSISTANT", q, now)
	if err != nil {
		t.Fatal(err)
	}
	if r.ScopeName != "CNTT" || r.Scores.TotalStudents != 12 || len(r.TopStudents) != 1 || r.Events[0].Registered != 3 || r.Events[0].Attended != 1 {
		t.Fatalf("faculty scope leak: %+v", r)
	}
	q.PageSize = 1
	q.Page = 2
	q.Sort = "registered"
	q.TopLimit = 1
	q.SchoolYearID = 2
	r, err = repo.GetAnalytics(context.Background(), 1, "ADMIN", q, now)
	if err != nil {
		t.Fatal(err)
	}
	if len(r.Events) != 1 || r.Events[0].ID != 2 || r.EventTotal != 3 || len(r.TopStudents) != 1 || r.Scores.GradedStudents != 1 || r.Scores.Bands[0].Count != 1 {
		t.Fatalf("pagination or selected semester: %+v", r)
	}
	q.Page = 99
	q.Sort = "no_show"
	q.SchoolYearID = 0
	r, err = repo.GetAnalytics(context.Background(), 1, "ADMIN", q, now)
	if err != nil || len(r.Events) != 0 || r.EventTotal != 3 {
		t.Fatalf("empty page: %+v %v", r, err)
	}
	q.Page = 1
	q.SchoolYearID = 999
	if _, err = repo.GetAnalytics(context.Background(), 1, "ADMIN", q, now); err != ErrReportSemesterNotFound {
		t.Fatalf("unknown semester: %v", err)
	}
	q.SchoolYearID = 0
	q.Period = model.ReportPeriod{FromDate: "2027-01-01", ToDate: "2027-01-31"}
	r, err = repo.GetAnalytics(context.Background(), 1, "ADMIN", q, now)
	if err != nil || r.EventTotal != 0 || len(r.TopStudents) != 0 {
		t.Fatalf("future events: %+v %v", r, err)
	}
	if _, err = repo.GetAnalytics(context.Background(), 1, "STUDENT", q, now); err != ErrReportForbidden {
		t.Fatal("student role must be denied")
	}
	t.Run("report details", func(t *testing.T) { testReportDetailsFixtures(t, tx) })
}
