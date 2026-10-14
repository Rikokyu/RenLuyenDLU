package service

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"mime"
	"path"
	"strings"
	"time"

	"gorm.io/gorm"
	"renluyen-dlu-backend/internal/storage"
)

var ErrRegistrationUnavailable = errors.New("Hoạt động không thuộc danh sách đăng ký của sinh viên.")
var ErrEvidenceRequestConflict = errors.New("Yêu cầu đã được sử dụng cho minh chứng khác. Vui lòng mở lại biểu mẫu.")

type EvidenceSubmission struct {
	UserID, ActorID, RegistrationID int64
	RequestKey, Filename, MIME      string
	Content                         []byte
}

type evidenceData struct {
	Filename   string `json:"filename"`
	MIME       string `json:"mime"`
	DataURL    string `json:"dataUrl"`
	SHA256     string `json:"sha256"`
	RequestKey string `json:"requestKey"`
	ActorID    int64  `json:"actorId"`
}

func SaveEvidenceSubmission(
	ctx context.Context,
	db *gorm.DB,
	objectStorage storage.Storage,
	input EvidenceSubmission,
) (id int64, replayed bool, err error) {
	digest := fmt.Sprintf("%x", sha256.Sum256(input.Content))
	// Each attempt owns its object, so rollback cleanup cannot delete a retry's file.
	var attempt [16]byte
	if _, err = rand.Read(attempt[:]); err != nil {
		return
	}
	objectKey := evidenceObjectKey(input.ActorID, input.RequestKey+hex.EncodeToString(attempt[:]), input.MIME)
	objectUploaded := false
	readyToCommit := false

	err = db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		lockKey := fmt.Sprintf("evidence:%d:%s", input.ActorID, input.RequestKey)
		if err := tx.Exec(`SELECT pg_advisory_xact_lock(hashtextextended(?, 0))`, lockKey).Error; err != nil {
			return err
		}

		var registrationCount int64
		if err := tx.Table("activity_registration ar").
			Joins("JOIN student s ON s.id=ar.idstudent").
			Where("ar.id=? AND s.iduser=? AND ar.status=1", input.RegistrationID, input.UserID).
			Count(&registrationCount).Error; err != nil {
			return err
		}
		if registrationCount == 0 {
			return ErrRegistrationUnavailable
		}

		var existing struct {
			ID             int64
			RegistrationID int64
			Filename       string
			SHA256         string
		}
		result := tx.Table("evidence_upload eu").
			Select("e.id, e.idacregis AS registration_id, eu.filename, eu.sha256").
			Joins("JOIN evidence e ON e.id=eu.evidence_id").
			Where("eu.created_by=? AND eu.request_key=?", input.ActorID, input.RequestKey).
			Take(&existing)
		if result.Error == nil {
			if existing.SHA256 != digest || existing.Filename != input.Filename || existing.RegistrationID != input.RegistrationID {
				return ErrEvidenceRequestConflict
			}
			id, replayed = existing.ID, true
			return nil
		}
		if !errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return result.Error
		}

		// Support retrying requests created before object metadata was introduced.
		type existingRow struct {
			ID   int64
			Data string
		}
		var rows []existingRow
		if err := tx.Raw(
			`SELECT id, data FROM evidence WHERE idacregis = ? AND data LIKE ?`,
			input.RegistrationID, `%"`+input.RequestKey+`"%`,
		).Scan(&rows).Error; err != nil {
			return err
		}
		for _, row := range rows {
			var stored evidenceData
			if err := json.Unmarshal([]byte(row.Data), &stored); err != nil {
				continue
			}
			if stored.RequestKey == input.RequestKey && stored.ActorID == input.ActorID {
				if stored.SHA256 != digest || stored.Filename != input.Filename {
					return ErrEvidenceRequestConflict
				}
				id, replayed = row.ID, true
				return nil
			}
		}

		if err := objectStorage.Put(ctx, objectKey, input.MIME, input.Content); err != nil {
			return fmt.Errorf("không thể lưu ảnh vào MinIO: %w", err)
		}
		objectUploaded = true

		if err := tx.Raw(
			`INSERT INTO evidence (submitat, data, status, idacregis) VALUES (LOCALTIMESTAMP, ?, 0, ?) RETURNING id`,
			input.Filename, input.RegistrationID,
		).Scan(&id).Error; err != nil {
			return err
		}

		if err := tx.Exec(
			`INSERT INTO evidence_upload (evidence_id, created_by, request_key, filename, mime_type, sha256, object_key) VALUES (?, ?, ?, ?, ?, ?, ?)`,
			id, input.ActorID, input.RequestKey, input.Filename, input.MIME, digest, objectKey,
		).Error; err != nil {
			return err
		}
		readyToCommit = true
		return nil
	})

	// A lost COMMIT response does not prove rollback. Preserve the object in that
	// case: the database may already reference it and a retry can recover the row.
	if err != nil && objectUploaded && !readyToCommit {
		cleanupContext, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if cleanupErr := objectStorage.Delete(cleanupContext, objectKey); cleanupErr != nil {
			return id, replayed, errors.Join(err, fmt.Errorf("không thể dọn ảnh MinIO sau khi lưu DB thất bại: %w", cleanupErr))
		}
	}
	return
}

func evidenceObjectKey(actorID int64, requestKey, mimeType string) string {
	extension := ".img"
	switch strings.ToLower(strings.TrimSpace(mimeType)) {
	case "image/jpeg":
		extension = ".jpg"
	case "image/png":
		extension = ".png"
	default:
		if extensions, err := mime.ExtensionsByType(mimeType); err == nil && len(extensions) > 0 {
			extension = extensions[0]
		}
	}
	requestDigest := sha256.Sum256([]byte(requestKey))
	return path.Join("evidence", fmt.Sprint(actorID), hex.EncodeToString(requestDigest[:])+strings.ToLower(extension))
}
