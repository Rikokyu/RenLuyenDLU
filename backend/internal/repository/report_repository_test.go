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

// Temporary tables shadow real tables on this transaction's connection. All fixtures
// and DDL roll back; no production/student records are modified.
func TestReportOverviewPostgres(t *testing.T) {
	dsn := os.Getenv("TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("set TEST_DATABASE_URL to run PostgreSQL integration tests")
	}
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Fatal(err)
	}
	tx := db.Begin()
	if tx.Error != nil {
		t.Fatal(tx.Error)
	}
	defer tx.Rollback()
	// Also execute against the actual application schema before shadowing with fixtures.
	livePeriod := model.ReportPeriod{FromDate: "2026-08-01", ToDate: "2027-01-31"}
	livePrevious := model.ReportPeriod{FromDate: "2026-02-01", ToDate: "2026-07-31"}
	live, err := NewReportRepository(tx).GetReportOverview(context.Background(), 1, "ADMIN", livePeriod, livePrevious, time.Now())
	if err != nil {
		t.Fatalf("actual database schema: %v", err)
	}
	t.Logf("actual database: students=%d, events=%d, registrations=%d, confirmed=%d, hours=%.2f", live.Current.TotalStudents, live.Current.OrganizedEvents, live.Current.Registrations, live.Current.ConfirmedParticipations, live.Current.VolunteerHours)
	statements := []string{
		`CREATE TEMP TABLE "User" (id bigint, idrole bigint, responsiblefaculty text, email text) ON COMMIT DROP`,
		`CREATE TEMP TABLE faculty (id bigint, name text, faculty_code text) ON COMMIT DROP`,
		`CREATE TEMP TABLE lecturer (iduser bigint, idfaculty bigint) ON COMMIT DROP`,
		`CREATE TEMP TABLE major (id bigint, idfaculty bigint) ON COMMIT DROP`,
		`CREATE TEMP TABLE class (id bigint, idmajor bigint) ON COMMIT DROP`,
		`CREATE TEMP TABLE student (id bigint, idclass bigint) ON COMMIT DROP`,
		`CREATE TEMP TABLE activity (id bigint, timebegin timestamp, timeend timestamp, status int, iduser bigint) ON COMMIT DROP`,
		`CREATE TEMP TABLE activity_registration (id bigint, idstudent bigint, idactivity bigint, status int, registeredat timestamp) ON COMMIT DROP`,
		`CREATE TEMP TABLE evidence (id bigint, idacregis bigint, status int) ON COMMIT DROP`,
		`INSERT INTO "User" VALUES (1,1,'','admin'),(2,2,'CT','assistant'),(3,2,'KT','other')`,
		`INSERT INTO faculty VALUES (1,'CNTT','CT'),(2,'Kinh tế','KT')`,
		`INSERT INTO major VALUES (1,1),(2,2)`,
		`INSERT INTO class VALUES (1,1),(2,2)`,
		`INSERT INTO student VALUES (1,1),(2,1),(3,2)`,
		`INSERT INTO activity VALUES
		 (1,'2026-08-02 08:00','2026-08-02 10:30',1,1),
		 (2,'2026-08-03 08:00','2026-08-03 12:00',1,2),
		 (3,'2026-08-04 08:00','2026-08-04 09:00',0,1),
		 (4,'2026-08-05 08:00','2026-08-05 09:00',1,NULL),
		 (5,'2026-07-10 08:00','2026-07-10 09:00',1,1),
		 (6,'2026-08-06 08:00','2026-08-06 11:00',1,3),
		 (7,'2026-08-31 23:00','2026-08-31 23:59:59',1,1),
		 (8,'2026-09-01 00:00','2026-09-01 01:00',1,1),
		 (9,'2027-01-01 08:00','2027-01-01 09:00',1,1)`,
		`INSERT INTO activity_registration VALUES
		 (1,1,1,1,'2026-08-01'),(2,2,1,1,'2026-08-01'),(3,3,1,1,'2026-08-01'),
		 (4,1,2,1,'2026-08-01'),(5,1,3,1,'2026-08-01'),(6,2,2,0,'2026-08-01'),
		 (7,1,1,1,'2026-07-31'),(8,1,5,1,'2026-07-01'),(9,3,6,1,'2026-08-01')`,
		`INSERT INTO evidence VALUES (1,1,1),(2,1,1),(3,2,1),(4,2,2),(5,3,0),(6,4,1),(7,5,1),(8,6,1),(9,7,1),(10,8,1),(11,9,1)`,
	}
	for _, sql := range statements {
		if err := tx.Exec(sql).Error; err != nil {
			t.Fatal(err)
		}
	}
	p := model.ReportPeriod{FromDate: "2026-08-01", ToDate: "2026-08-31"}
	prev := model.ReportPeriod{FromDate: "2026-07-01", ToDate: "2026-07-31"}
	now := time.Date(2026, 10, 21, 0, 0, 0, 0, time.UTC)
	repo := NewReportRepository(tx)
	result, err := repo.GetReportOverview(context.Background(), 1, "ADMIN", p, prev, now)
	if err != nil {
		t.Fatal(err)
	}
	m := result.Current
	if m.TotalStudents != 3 || m.ParticipatingStudents != 2 || m.OrganizedEvents != 5 || m.SchoolEvents != 2 || m.FacultyEvents != 2 || m.UnclassifiedEvents != 1 || m.Registrations != 5 || m.ConfirmedParticipations != 3 || m.VolunteerHours != 9.5 {
		t.Fatalf("incorrect aggregates: %+v", m)
	}
	if result.Previous.VolunteerHours != 1 || result.Previous.ParticipatingStudents != 1 {
		t.Fatalf("incorrect previous period: %+v", result.Previous)
	}
	result, err = repo.GetReportOverview(context.Background(), 2, "STUDENT_AFFAIRS_ASSISTANT", p, prev, now)
	if err != nil {
		t.Fatal(err)
	}
	m = result.Current
	if result.ScopeName != "CNTT" || m.TotalStudents != 2 || m.ParticipatingStudents != 1 || m.OrganizedEvents != 2 || m.Registrations != 3 || m.ConfirmedParticipations != 2 || m.VolunteerHours != 6.5 {
		t.Fatalf("faculty scope leaked: %+v", result)
	}
	if _, err = repo.GetReportOverview(context.Background(), 1, "STUDENT", p, prev, now); err != ErrReportForbidden {
		t.Fatalf("role restriction: %v", err)
	}
	empty := model.ReportPeriod{FromDate: "2027-01-01", ToDate: "2027-01-31"}
	result, err = repo.GetReportOverview(context.Background(), 1, "ADMIN", empty, prev, now)
	if err != nil || result.Current.OrganizedEvents != 0 || result.Current.VolunteerHours != 0 {
		t.Fatalf("future events counted: %+v %v", result, err)
	}
}
