package handler

import (
	"encoding/json"
	"github.com/gin-gonic/gin"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"net/http/httptest"
	"os"
	"reflect"
	"testing"
)

func TestStudentEvidenceQueries(t *testing.T) {
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
	// Fixtures remain inside a rolled-back transaction; existing evidence is untouched.
	statements := []string{
		`INSERT INTO activity(id,activity_code,title,timebegin,timeend,score) VALUES (-901,'TEST_STU_A','Test evidence A','2026-01-01','2026-01-02',5),(-902,'TEST_STU_B','Test evidence B','2026-01-01','2026-01-02',20)`,
		`INSERT INTO activity_registration(id,registeredat,idstudent,idactivity) VALUES (-901,'2025-01-01',(SELECT id FROM student WHERE iduser=27),-901),(-902,'2025-01-01',(SELECT id FROM student WHERE iduser=27),-902)`,
		`INSERT INTO evidence(id,submitat,data,status,idacregis) VALUES (-901,'2026-01-02 23:59:59','test',0,-901),(-902,'2026-01-01 00:00:00','test',3,-902)`,
	}
	for _, sql := range statements {
		if err := tx.Exec(sql).Error; err != nil {
			t.Fatal(err)
		}
	}
	for _, tc := range []struct {
		query string
		ids   []int64
	}{
		{"search=TEST_STU&sort_by=score&sort_order=asc", []int64{-901, -902}},
		{"search=TEST_STU&sort_by=score&sort_order=desc", []int64{-902, -901}},
		{"search=TEST_STU&sort_by=date&sort_order=asc", []int64{-902, -901}},
		{"search=TEST_STU&sort_by=date&sort_order=desc", []int64{-901, -902}},
		{"search=TEST_STU&from_date=2026-01-02&to_date=2026-01-02", []int64{-901}},
		{"search=Test%20evidence%20B", []int64{-902}},
		{"search=TEST_STU&from_date=2026-01-03", []int64{}},
		{"search=TEST_STU&user_id=28", []int64{}},
		{"search=TEST_STU&status=0", []int64{-901}},
		{"search=TEST_STU&status=1", []int64{}},
		{"search=TEST_STU&status=2", []int64{}},
		{"search=TEST_STU&status=3", []int64{-902}},
		{"search=TEST_STU&status=3&from_date=2026-01-02", []int64{}},
	} {
		t.Run(tc.query, func(t *testing.T) {
			r := gin.New()
			r.GET("/", func(c *gin.Context) { c.Set("userID", int64(27)); c.Set("role", "ADMIN") }, StudentEvidenceList(tx))
			w := httptest.NewRecorder()
			r.ServeHTTP(w, httptest.NewRequest("GET", "/?"+tc.query, nil))
			if w.Code != 200 {
				t.Fatalf("%d: %s", w.Code, w.Body.String())
			}
			var body struct {
				Data  []StudentEvidenceRow
				Stats map[string]int64
			}
			if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
				t.Fatal(err)
			}
			ids := []int64{}
			for _, row := range body.Data {
				ids = append(ids, row.ID)
			}
			if !reflect.DeepEqual(ids, tc.ids) {
				t.Fatalf("got %v, want %v", ids, tc.ids)
			}
			if tc.query != "search=TEST_STU&user_id=28" && (body.Stats["pending"] < 1 || body.Stats["needMore"] < 1) {
				t.Fatal("statistics must cover all student evidence, independently of filters")
			}
		})
	}
}

func TestStudentEvidenceRejectsInvalidQueries(t *testing.T) {
	gin.SetMode(gin.TestMode)
	for _, tc := range []struct {
		query  string
		status int
	}{
		{"user_id=28", 403}, {"user_id=abc", 400}, {"user_id=-1", 400},
		{"from_date=2026-02-30", 400}, {"from_date=2026-06-02&to_date=2026-06-01", 400},
		{"sort_by=score%3BDROP%20TABLE%20evidence", 400}, {"sort_order=invalid", 400},
		{"status=-1", 400}, {"status=4", 400}, {"status=abc", 400}, {"status=0%20OR%201=1", 400},
	} {
		t.Run(tc.query, func(t *testing.T) {
			r := gin.New()
			r.GET("/", func(c *gin.Context) { c.Set("userID", int64(27)); c.Set("role", "STUDENT") }, StudentEvidenceList(nil))
			w := httptest.NewRecorder()
			req := httptest.NewRequest("GET", "/?"+tc.query, nil)
			r.ServeHTTP(w, req)
			if w.Code != tc.status {
				t.Fatalf("got %d, want %d: %s", w.Code, tc.status, w.Body.String())
			}
		})
	}
}
