package handler

import (
	"errors"
	"log"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"renluyen-dlu-backend/internal/storage"
)

// Lock the evidence so approval and cancellation cannot both succeed.
func StudentEvidenceCancel(db *gorm.DB, objectStorage storage.Storage) gin.HandlerFunc {
	return func(c *gin.Context) {
		query, ok := accessibleStudentEvidence(c, db)
		if !ok {
			return
		}
		var row struct {
			ID        int64
			Status    int
			ObjectKey string
		}
		blocked := errors.New("evidence cannot be cancelled")
		err := db.WithContext(c.Request.Context()).Transaction(func(tx *gorm.DB) error {
			result := tx.Raw("SELECT e.id, e.status, COALESCE(eu.object_key, '') AS object_key FROM evidence e LEFT JOIN evidence_upload eu ON eu.evidence_id=e.id WHERE e.id IN (?) FOR UPDATE OF e", query.Select("e.id")).Scan(&row)
			if result.Error != nil {
				return result.Error
			}
			if result.RowsAffected == 0 {
				return gorm.ErrRecordNotFound
			}
			if row.Status != 0 && row.Status != 3 {
				return blocked
			}
			return tx.Exec("DELETE FROM evidence WHERE id=? AND status IN (0,3)", row.ID).Error
		})
		switch {
		case errors.Is(err, gorm.ErrRecordNotFound):
			c.JSON(404, gin.H{"message": "Không tìm thấy minh chứng hoặc bạn không có quyền hủy."})
		case errors.Is(err, blocked):
			message := "Trạng thái minh chứng không cho phép hủy."
			if row.Status == 1 {
				message = "Minh chứng đã được phê duyệt, không thể hủy."
			} else if row.Status == 2 {
				message = "Minh chứng đã bị từ chối, không thể hủy."
			}
			c.JSON(409, gin.H{"message": message, "statusCode": row.Status})
		case err != nil:
			c.JSON(500, gin.H{"message": "Không thể hủy minh chứng. Vui lòng thử lại."})
		default:
			if row.ObjectKey != "" && objectStorage != nil {
				if err := objectStorage.Delete(c.Request.Context(), row.ObjectKey); err != nil {
					log.Printf("Cannot remove cancelled evidence object %s: %v", row.ObjectKey, err)
				}
			}
			c.JSON(200, gin.H{"message": "Đã hủy minh chứng."})
		}
	}
}
