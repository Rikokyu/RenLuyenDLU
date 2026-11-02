package handler

import (
	"context"
	"errors"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"renluyen-dlu-backend/internal/model"
	"renluyen-dlu-backend/internal/repository"
)

type analyticsStub struct {
	called bool
	query  model.ReportAnalyticsQuery
	err    error
}

func (s *analyticsStub) GetAnalytics(_ context.Context, _ int64, _ string, q model.ReportAnalyticsQuery, _ time.Time) (*model.ReportAnalytics, error) {
	s.called = true
	s.query = q
	return &model.ReportAnalytics{}, s.err
}

func TestReportAnalyticsHandler(t *testing.T) {
	gin.SetMode(gin.TestMode)
	for _, tc := range []struct {
		query, role string
		id          int64
		want        int
		err         error
	}{
		{"", "ADMIN", 1, 200, nil}, {"?page=2&page_size=10&top_limit=3&sort=no_show&school_year_id=4", "STUDENT_AFFAIRS_ASSISTANT", 2, 200, nil},
		{"", "STUDENT", 1, 403, nil}, {"", "HOMEROOM_TEACHER", 1, 403, nil}, {"", "ADMIN", 0, 401, nil},
		{"?page=0", "ADMIN", 1, 400, nil}, {"?page=-1", "ADMIN", 1, 400, nil}, {"?page=2147483648", "ADMIN", 1, 400, nil},
		{"?page_size=101", "ADMIN", 1, 400, nil}, {"?top_limit=51", "ADMIN", 1, 400, nil}, {"?school_year_id=abc", "ADMIN", 1, 400, nil},
		{"?school_year_id=-1", "ADMIN", 1, 400, nil}, {"?sort=id;DROP%20TABLE%20student", "ADMIN", 1, 400, nil},
		{"?sort=id%3BDROP%20TABLE%20student", "ADMIN", 1, 400, nil},
		{"?page=", "ADMIN", 1, 400, nil}, {"?page=1&page=2", "ADMIN", 1, 400, nil},
		{"?from_date=2026-02-30&to_date=2026-03-01", "ADMIN", 1, 400, nil}, {"?from_date=2026-01-01", "ADMIN", 1, 400, nil},
		{"", "ADMIN", 1, 400, repository.ErrReportSemesterNotFound}, {"", "ADMIN", 1, 500, errors.New("secret database address")},
	} {
		s := &analyticsStub{err: tc.err}
		r := gin.New()
		r.GET("/", func(c *gin.Context) { c.Set("userID", tc.id); c.Set("role", tc.role) }, ReportAnalytics(s))
		w := httptest.NewRecorder()
		r.ServeHTTP(w, httptest.NewRequest("GET", "/"+tc.query, nil))
		if w.Code != tc.want {
			t.Fatalf("%+v: status %d body %s", tc, w.Code, w.Body.String())
		}
		if tc.want != 200 && tc.err == nil && s.called {
			t.Fatal("invalid request reached database")
		}
		if strings.Contains(w.Body.String(), "secret database") {
			t.Fatal("database details leaked")
		}
		if tc.want == 200 && tc.query != "" && (s.query.Page != 2 || s.query.PageSize != 10 || s.query.TopLimit != 3 || s.query.SchoolYearID != 4 || s.query.Sort != "no_show") {
			t.Fatalf("incorrect query mapping: %+v", s.query)
		}
	}
}
