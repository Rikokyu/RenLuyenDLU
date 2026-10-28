package handler

import (
	"fmt"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func TestStudentEvidenceCancellationRejectsInvalidIDs(t *testing.T) {
	for _, id := range []string{"0", "-1", "abc"} {
		router := gin.New()
		router.DELETE("/:id", StudentEvidenceCancel(nil, nil))
		response := httptest.NewRecorder()
		router.ServeHTTP(response, httptest.NewRequest("DELETE", "/"+id, nil))
		if response.Code != 400 {
			t.Fatalf("id %s: got %d, want 400", id, response.Code)
		}
	}
}

func TestStudentEvidenceCancellation(t *testing.T) {
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
	var registration struct{ ID, UserID int64 }
	if err := tx.Table("activity_registration ar").Select("ar.id, s.iduser AS user_id").Joins("JOIN student s ON s.id=ar.idstudent").Take(&registration).Error; err != nil {
		t.Fatal(err)
	}
	for _, tc := range []struct {
		name      string
		status    int
		otherUser bool
		want      int
	}{
		{"pending", 0, false, 200}, {"approved", 1, false, 409},
		{"rejected", 2, false, 409}, {"needs supplement", 3, false, 200},
		{"another student's evidence", 0, true, 404},
	} {
		t.Run(tc.name, func(t *testing.T) {
			var id int64
			if err := tx.Raw("INSERT INTO evidence(submitat,data,status,idacregis) VALUES (NOW(),'cancel test',?,?) RETURNING id", tc.status, registration.ID).Scan(&id).Error; err != nil {
				t.Fatal(err)
			}
			userID := registration.UserID
			if tc.otherUser {
				userID = -1
			}
			router := gin.New()
			router.DELETE("/:id", func(c *gin.Context) { c.Set("userID", userID); c.Set("role", "STUDENT") }, StudentEvidenceCancel(tx, nil))
			response := httptest.NewRecorder()
			router.ServeHTTP(response, httptest.NewRequest("DELETE", fmt.Sprintf("/%d", id), nil))
			if response.Code != tc.want {
				t.Fatalf("got %d, want %d: %s", response.Code, tc.want, response.Body.String())
			}
			var count int64
			if err := tx.Table("evidence").Where("id=?", id).Count(&count).Error; err != nil {
				t.Fatal(err)
			}
			if (count == 0) != (tc.want == 200) {
				t.Fatal("unexpected evidence deletion")
			}
		})
	}
}
