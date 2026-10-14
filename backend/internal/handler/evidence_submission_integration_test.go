package handler

import (
	"bytes"
	"context"
	"crypto/sha256"
	"fmt"
	"io"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"renluyen-dlu-backend/internal/repository"
	"renluyen-dlu-backend/internal/service"
)

type evidenceTestStorage map[string][]byte

func (s evidenceTestStorage) Put(_ context.Context, key, mime string, content []byte) error {
	s[key] = append([]byte(nil), content...)
	return nil
}
func (s evidenceTestStorage) Get(_ context.Context, key string) (io.ReadCloser, error) {
	return io.NopCloser(bytes.NewReader(s[key])), nil
}
func (s evidenceTestStorage) Delete(_ context.Context, key string) error { delete(s, key); return nil }

func TestSubmissionDatabaseAndManagerReadback(t *testing.T) {
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
	if err := tx.Table("activity_registration ar").Select("ar.id, s.iduser AS user_id").Joins("JOIN student s ON s.id=ar.idstudent").Where("ar.status=1").Take(&registration).Error; err != nil {
		t.Fatal(err)
	}
	// Keep the registration date different from the actual submission date.
	if err := tx.Exec("UPDATE activity_registration SET registeredat='2000-01-01' WHERE id=?", registration.ID).Error; err != nil {
		t.Fatal(err)
	}
	store := evidenceTestStorage{}
	input := service.EvidenceSubmission{UserID: registration.UserID, ActorID: registration.UserID, RegistrationID: registration.ID, RequestKey: fmt.Sprintf("integration-%d", time.Now().UnixNano()), Filename: "integration.png", MIME: "image/png", Content: []byte("test object bytes")}
	id, replayed, err := service.SaveEvidenceSubmission(context.Background(), tx, store, input)
	if err != nil || replayed || id <= 0 {
		t.Fatalf("save: id=%d replayed=%v error=%v", id, replayed, err)
	}
	var row struct {
		Status                                      int
		Idacregis, CreatedBy                        int64
		Data, Filename, MIMEType, SHA256, ObjectKey string
		Submitat                                    time.Time
	}
	if err := tx.Table("evidence e").Select("e.*, eu.created_by, eu.filename, eu.mime_type, eu.sha256, eu.object_key").Joins("JOIN evidence_upload eu ON eu.evidence_id=e.id").Where("e.id=?", id).Take(&row).Error; err != nil {
		t.Fatal(err)
	}
	if row.Status != 0 || row.Idacregis != registration.ID || row.CreatedBy != input.ActorID || row.Data != input.Filename || row.Filename != input.Filename || row.MIMEType != input.MIME || row.SHA256 != fmt.Sprintf("%x", sha256.Sum256(input.Content)) || row.Submitat.IsZero() || !bytes.Equal(store[row.ObjectKey], input.Content) {
		t.Fatalf("incorrect stored metadata: %+v", row)
	}
	retryID, replayed, err := service.SaveEvidenceSubmission(context.Background(), tx, store, input)
	if err != nil || !replayed || retryID != id || len(store) != 1 {
		t.Fatalf("retry duplicated submission: %d %v %v", retryID, replayed, err)
	}
	repo := repository.NewEvidenceRepository(tx)
	day := time.Date(row.Submitat.Year(), row.Submitat.Month(), row.Submitat.Day(), 0, 0, 0, 0, row.Submitat.Location())
	evidences, err := repo.GetEvidences(context.Background(), "", nil, nil, nil, nil, &day, &day)
	if err != nil {
		t.Fatal(err)
	}
	found := false
	for _, evidence := range evidences {
		if evidence.ID == id {
			found = evidence.SubmitAt != nil && evidence.Registration.ID == registration.ID
		}
	}
	if !found {
		t.Fatal("manager date filter omitted newly submitted evidence")
	}
	r := gin.New()
	r.GET("/evidences/:id/file", ManagerEvidenceFile(tx, store))
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest("GET", fmt.Sprintf("/evidences/%d/file", id), nil))
	if w.Code != 200 || !bytes.Equal(w.Body.Bytes(), input.Content) || w.Header().Get("Content-Type") != input.MIME {
		t.Fatalf("manager file response: %d %s", w.Code, w.Body.String())
	}
}
