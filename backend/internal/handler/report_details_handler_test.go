package handler

import (
	"context"
	"errors"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"renluyen-dlu-backend/internal/model"
	"renluyen-dlu-backend/internal/repository"
)

type detailsStub struct {
	called bool
	q      model.ReportDetailQuery
	err    error
}

func (s *detailsStub) GetDetails(_ context.Context, _ int64, _ string, q model.ReportDetailQuery) (*model.ReportDetails, error) {
	s.called = true
	s.q = q
	return &model.ReportDetails{Items: []model.ReportDetailRow{}, Classes: []model.ReportClassOption{}}, s.err
}
func TestReportDetailsExportHandler(t *testing.T) {
	gin.SetMode(gin.TestMode)
	for _, tc := range []struct {
		role string
		want int
		err  error
	}{
		{"ADMIN", 200, nil}, {"STUDENT_AFFAIRS_ASSISTANT", 200, nil}, {"STUDENT", 403, nil},
		{"ADMIN", 413, repository.ErrReportExportTooLarge},
	} {
		s := &detailsStub{err: tc.err}
		r := gin.New()
		r.GET("/", func(c *gin.Context) { c.Set("userID", int64(1)); c.Set("role", tc.role) }, ReportDetailsExport(s))
		w := httptest.NewRecorder()
		r.ServeHTTP(w, httptest.NewRequest("GET", "/?class_id=2&page=2&page_size=1", nil))
		if w.Code != tc.want {
			t.Fatalf("export status: %d %s", w.Code, w.Body.String())
		}
		if tc.want == 200 && (!s.q.Export || s.q.ClassID != 2 || w.Header().Get("Cache-Control") != "no-store") {
			t.Fatal("export query or response header incorrect")
		}
		if tc.want == 403 && s.called {
			t.Fatal("student queried export")
		}
	}
}

func TestReportDetailsHandler(t *testing.T) {
	gin.SetMode(gin.TestMode)
	for _, tc := range []struct {
		query, role string
		id          int64
		want        int
		fail        bool
	}{
		{"", "ADMIN", 1, 200, false}, {"?class_id=1&major_id=2&faculty_id=3&page=2&page_size=20&search=hello", "STUDENT_AFFAIRS_ASSISTANT", 2, 200, false},
		{"", "ADMIN", 0, 401, false}, {"", "STUDENT", 3, 403, false},
		{"?class_id=abc", "ADMIN", 1, 400, false}, {"?class_id=-1", "ADMIN", 1, 400, false}, {"?faculty_id=0", "ADMIN", 1, 400, false}, {"?major_id=", "ADMIN", 1, 400, false},
		{"?page_size=101", "ADMIN", 1, 400, false}, {"?page=0", "ADMIN", 1, 400, false}, {"?page=1&page=2", "ADMIN", 1, 400, false},
		{"?class_id=1;DROP", "ADMIN", 1, 400, false}, {"?search=" + strings.Repeat("a", 201), "ADMIN", 1, 400, false}, {"", "ADMIN", 1, 500, true},
	} {
		s := &detailsStub{}
		if tc.fail {
			s.err = errors.New("secret db address")
		}
		r := gin.New()
		r.GET("/", func(c *gin.Context) { c.Set("userID", tc.id); c.Set("role", tc.role) }, ReportDetails(s))
		w := httptest.NewRecorder()
		r.ServeHTTP(w, httptest.NewRequest("GET", "/"+tc.query, nil))
		if w.Code != tc.want {
			t.Fatalf("%+v: got %d %s", tc, w.Code, w.Body.String())
		}
		if tc.want != 200 && !tc.fail && s.called {
			t.Fatal("invalid request queried database")
		}
		if strings.Contains(w.Body.String(), "secret db") {
			t.Fatal("leaked database details")
		}
		if tc.want == 200 && tc.query != "" && (s.q.ClassID != 1 || s.q.MajorID != 2 || s.q.FacultyID != 3 || s.q.Page != 2 || s.q.PageSize != 20 || s.q.Search != "hello") {
			t.Fatalf("query mapping: %+v", s.q)
		}
	}
}
