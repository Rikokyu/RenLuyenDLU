package handler

import (
	"context"
	"encoding/json"
	"errors"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"renluyen-dlu-backend/internal/model"
)

type reportStub struct {
	called bool
	fail   bool
}

func (s *reportStub) GetReportOverview(_ context.Context, id int64, role string, p, prev model.ReportPeriod, _ time.Time) (*model.ReportOverview, error) {
	s.called = true
	if s.fail {
		return nil, errors.New("secret connection details")
	}
	return &model.ReportOverview{Period: p, PreviousPeriod: prev, Current: model.ReportMetrics{Registrations: 4, ConfirmedParticipations: 1}}, nil
}

func TestReportHandler(t *testing.T) {
	gin.SetMode(gin.TestMode)
	for _, tc := range []struct {
		role, query string
		id          int64
		want        int
		fail        bool
	}{
		{"ADMIN", "", 1, 200, false}, {"STUDENT_AFFAIRS_ASSISTANT", "", 2, 200, false},
		{"STUDENT", "", 3, 403, false}, {"HOMEROOM_TEACHER", "", 3, 403, false},
		{"ADMIN", "", 0, 401, false}, {"ADMIN", "?from_date=bad", 1, 400, false},
		{"ADMIN", "?from_date=2026-01-01&to_date=2026-01-31", 1, 200, false},
		{"ADMIN", "", 1, 500, true},
	} {
		s := &reportStub{fail: tc.fail}
		r := gin.New()
		r.GET("/", func(c *gin.Context) { c.Set("userID", tc.id); c.Set("role", tc.role) }, NewReportHandler(s).GetOverview)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, httptest.NewRequest("GET", "/"+tc.query, nil))
		if w.Code != tc.want {
			t.Fatalf("%+v: %d %s", tc, w.Code, w.Body.String())
		}
		if tc.want < 500 && tc.want != 200 && s.called {
			t.Fatal("invalid requests must not query database")
		}
		if tc.want == 200 {
			var body struct{ Data model.ReportOverview }
			if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
				t.Fatal(err)
			}
			if body.Data.Current.CheckInRate == nil || *body.Data.Current.CheckInRate != 25 {
				t.Fatalf("missing calculated percentage: %s", w.Body.String())
			}
		}
		if tc.fail && strings.Contains(w.Body.String(), "secret connection details") {
			t.Fatal("database details leaked")
		}
	}
}
