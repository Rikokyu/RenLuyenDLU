package handler

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"image"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"log"
	"mime"
	"net/http"
	"path"
	"regexp"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"renluyen-dlu-backend/internal/service"
	"renluyen-dlu-backend/internal/storage"
)

const maxEvidenceImageSize = 5 * 1024 * 1024

var evidenceRequestKey = regexp.MustCompile(`^[A-Za-z0-9_-]{16,128}$`)

// evidenceDataJSON khớp với cấu trúc JSON được lưu trong Evidence.Data
type evidenceDataJSON struct {
	Filename   string `json:"filename"`
	MIME       string `json:"mime"`
	DataURL    string `json:"dataUrl"`
	SHA256     string `json:"sha256"`
	RequestKey string `json:"requestKey"`
	ActorID    int64  `json:"actorId"`
}

func studentEvidenceUserID(c *gin.Context) (int64, bool) {
	id := c.GetInt64("userID")
	if value := c.Query("user_id"); value != "" {
		requested, err := strconv.ParseInt(value, 10, 64)
		if err != nil || requested <= 0 {
			c.JSON(400, gin.H{"message": "Mã người dùng không hợp lệ."})
			return 0, false
		}
		if requested != id && c.GetString("role") != "ADMIN" && c.GetString("role") != "STUDENT_AFFAIRS_ASSISTANT" {
			c.JSON(403, gin.H{"message": "Bạn chỉ được xem hoặc nộp minh chứng của mình."})
			return 0, false
		}
		id = requested
	}
	return id, true
}

func StudentEvidenceActivities(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, ok := studentEvidenceUserID(c)
		if !ok {
			return
		}
		rows := []struct {
			RegistrationID int64  `json:"registrationId"`
			ActivityCode   string `json:"activityCode"`
			Title          string `json:"title"`
			Score          int    `json:"score"`
		}{}
		err := db.WithContext(c.Request.Context()).Table("activity_registration ar").Select("ar.id AS registration_id, a.activity_code, a.title, a.score").Joins("JOIN student s ON s.id=ar.idstudent").Joins("JOIN activity a ON a.id=ar.idactivity").Where("s.iduser=? AND ar.status=1", userID).Order("a.timebegin DESC, ar.id DESC").Scan(&rows).Error
		if err != nil {
			c.JSON(500, gin.H{"message": "Không thể tải hoạt động đã đăng ký."})
			return
		}
		c.JSON(200, gin.H{"data": rows})
	}
}

func StudentEvidenceCreate(db *gorm.DB, objectStorage storage.Storage) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, ok := studentEvidenceUserID(c)
		if !ok {
			return
		}
		c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxEvidenceImageSize+64*1024)
		if err := c.Request.ParseMultipartForm(maxEvidenceImageSize + 64*1024); err != nil {
			var tooLarge *http.MaxBytesError
			if errors.As(err, &tooLarge) {
				c.JSON(413, gin.H{"message": "Ảnh không được vượt quá 5 MB."})
			} else {
				c.JSON(400, gin.H{"message": "Dữ liệu tải lên không hợp lệ."})
			}
			return
		}
		defer c.Request.MultipartForm.RemoveAll()
		registrationValue := c.PostForm("IdAcRegis")
		if registrationValue == "" {
			registrationValue = c.PostForm("registration_id")
		}
		registrationID, err := strconv.ParseInt(registrationValue, 10, 64)
		if err != nil || registrationID <= 0 {
			c.JSON(400, gin.H{"message": "Vui lòng chọn hoạt động đã đăng ký."})
			return
		}
		key := c.PostForm("request_key")
		if !evidenceRequestKey.MatchString(key) {
			c.JSON(400, gin.H{"message": "Mã yêu cầu không hợp lệ. Vui lòng mở lại biểu mẫu."})
			return
		}
		files := c.Request.MultipartForm.File["file"]
		if len(files) != 1 || len(c.Request.MultipartForm.File) != 1 {
			c.JSON(400, gin.H{"message": "Vui lòng chọn đúng một ảnh JPG hoặc PNG."})
			return
		}
		header := files[0]
		if header.Size > maxEvidenceImageSize {
			c.JSON(413, gin.H{"message": "Ảnh không được vượt quá 5 MB."})
			return
		}
		filename := path.Base(strings.ReplaceAll(header.Filename, "\\", "/"))
		if len(filename) > 200 || strings.ContainsAny(filename, "\r\n\x00") {
			c.JSON(400, gin.H{"message": "Tên tệp không hợp lệ hoặc quá dài."})
			return
		}
		file, err := header.Open()
		if err != nil {
			c.JSON(400, gin.H{"message": "Không thể đọc ảnh tải lên."})
			return
		}
		defer file.Close()
		content, err := io.ReadAll(io.LimitReader(file, maxEvidenceImageSize+1))
		if err != nil || len(content) == 0 {
			c.JSON(400, gin.H{"message": "Tệp ảnh trống hoặc không thể đọc."})
			return
		}
		if len(content) > maxEvidenceImageSize {
			c.JSON(413, gin.H{"message": "Ảnh không được vượt quá 5 MB."})
			return
		}
		config, format, err := decodeEvidenceImage(content)
		if errors.Is(err, errUnsupportedEvidenceImageFormat) {
			c.JSON(400, gin.H{"message": "Định dạng ảnh thực tế không phải JPG hoặc PNG."})
			return
		}
		if err != nil {
			c.JSON(400, gin.H{"message": "Không đọc được nội dung ảnh. Tệp có thể không phải JPG/PNG hợp lệ hoặc đã bị hỏng."})
			return
		}
		if config.Width <= 0 || config.Height <= 0 {
			c.JSON(400, gin.H{"message": "Kích thước ảnh không hợp lệ."})
			return
		}
		if pixels := int64(config.Width) * int64(config.Height); pixels > 20000000 {
			c.JSON(400, gin.H{"message": fmt.Sprintf("Ảnh có kích thước %d × %d (%d điểm ảnh), vượt giới hạn 20 triệu điểm ảnh.", config.Width, config.Height, pixels)})
			return
		}
		mimeType := "image/" + format
		id, replayed, err := service.SaveEvidenceSubmission(c.Request.Context(), db, objectStorage, service.EvidenceSubmission{UserID: userID, ActorID: c.GetInt64("userID"), RegistrationID: registrationID, RequestKey: key, Filename: filename, MIME: mimeType, Content: content})
		switch {
		case errors.Is(err, service.ErrRegistrationUnavailable):
			c.JSON(404, gin.H{"message": err.Error()})
		case errors.Is(err, service.ErrEvidenceRequestConflict):
			c.JSON(409, gin.H{"message": err.Error()})
		case err != nil:
			log.Printf("Không thể lưu minh chứng: %v", err)
			c.JSON(500, gin.H{"message": "Không thể lưu minh chứng. Bạn có thể thử gửi lại."})
		default:
			status := http.StatusCreated
			if replayed {
				status = http.StatusOK
			}
			c.JSON(status, gin.H{"data": gin.H{"id": id}, "replayed": replayed, "message": "Đã nộp minh chứng, đang chờ phê duyệt."})
		}
	}
}

var errUnsupportedEvidenceImageFormat = errors.New("unsupported evidence image format")

func decodeEvidenceImage(content []byte) (image.Config, string, error) {
	config, format, err := image.DecodeConfig(bytes.NewReader(content))
	if err != nil {
		return image.Config{}, "", err
	}
	if format != "jpeg" && format != "png" {
		return image.Config{}, format, errUnsupportedEvidenceImageFormat
	}
	// Check the header before decoding allocates memory for the full image.
	// The handler reports the dimensions using the returned configuration.
	if config.Width <= 0 || config.Height <= 0 || int64(config.Width)*int64(config.Height) > 20000000 {
		return config, format, nil
	}
	if _, _, err := image.Decode(bytes.NewReader(content)); err != nil {
		return image.Config{}, format, err
	}
	return config, format, nil
}

func accessibleStudentEvidence(c *gin.Context, db *gorm.DB) (*gorm.DB, bool) {
	return accessibleEvidence(c, db, false)
}

func accessibleEvidence(c *gin.Context, db *gorm.DB, manager bool) (*gorm.DB, bool) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id <= 0 {
		c.JSON(400, gin.H{"message": "Mã minh chứng không hợp lệ."})
		return nil, false
	}
	query := db.WithContext(c.Request.Context()).Table("evidence e").Joins("JOIN activity_registration ar ON ar.id=e.idacregis").Joins("JOIN student s ON s.id=ar.idstudent").Where("e.id=?", id)
	if !manager && c.GetString("role") != "ADMIN" && c.GetString("role") != "STUDENT_AFFAIRS_ASSISTANT" {
		query = query.Where("s.iduser=?", c.GetInt64("userID"))
	}
	return query, true
}

// parseEvidenceDataJSON thử parse cột Data như JSON (format mới).
// Nếu không phải JSON thì coi Data là tên file (format cũ).
func parseEvidenceDataJSON(data string) *evidenceDataJSON {
	var d evidenceDataJSON
	if err := json.Unmarshal([]byte(data), &d); err != nil {
		return nil
	}
	if d.Filename == "" {
		return nil
	}
	return &d
}

func StudentEvidenceDetail(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		query, ok := accessibleStudentEvidence(c, db)
		if !ok {
			return
		}
		var row struct {
			StudentEvidenceRow
			HasFile     bool   `json:"hasFile"`
			FileSize    int64  `json:"fileSize"`
			MIME        string `json:"mime"`
			SubmittedAt string `json:"submittedAt"`
			RawData     string `json:"-"`
			ObjectKey   string `json:"-"`
			StoredName  string `json:"-"`
			StoredMIME  string `json:"-"`
		}
		result := query.
			Joins(`JOIN "User" u ON u.id=s.iduser`).
			Joins("JOIN activity a ON a.id=ar.idactivity").
			Joins("LEFT JOIN class cl ON cl.id=s.idclass").
			Joins("LEFT JOIN evidence_upload eu ON eu.evidence_id=e.id").
			Select(`e.id, concat_ws(' ', u.firstname, u.lastname) AS student_name, s.student_code AS student_id, COALESCE(cl.name,'') AS faculty_class, a.title AS event, a.activity_code, COALESCE(to_char(e.submitat, 'YYYY-MM-DD'),'') AS submit_date, e.data AS raw_data, a.score, e.status AS status_code, a.detail AS description, COALESCE(to_char(e.submitat,'YYYY-MM-DD HH24:MI:SS'),'') AS submitted_at, COALESCE(eu.object_key,'') AS object_key, COALESCE(eu.filename,'') AS stored_name, COALESCE(eu.mime_type,'') AS stored_mime`).
			Scan(&row)
		if result.Error != nil {
			c.JSON(500, gin.H{"message": "Không thể tải chi tiết minh chứng."})
			return
		}
		if result.RowsAffected == 0 {
			c.JSON(404, gin.H{"message": "Không tìm thấy minh chứng hoặc bạn không có quyền xem."})
			return
		}

		// Parse Data để lấy tên file và kiểm tra có ảnh không
		if row.ObjectKey != "" {
			row.ProofName = row.StoredName
			row.HasFile = true
			row.MIME = row.StoredMIME
		} else if parsed := parseEvidenceDataJSON(row.RawData); parsed != nil {
			row.ProofName = parsed.Filename
			row.HasFile = parsed.DataURL != ""
			row.MIME = parsed.MIME
			if row.HasFile {
				// Ước tính kích thước file từ base64
				b64part := parsed.DataURL
				if idx := strings.Index(b64part, ","); idx >= 0 {
					b64part = b64part[idx+1:]
				}
				row.FileSize = int64(len(b64part)) * 3 / 4
			}
		} else {
			row.ProofName = row.RawData
			row.HasFile = false
		}
		c.JSON(200, gin.H{"data": row})
	}
}

func StudentEvidenceFile(db *gorm.DB, objectStorage storage.Storage) gin.HandlerFunc {
	return evidenceFile(db, objectStorage, false)
}

// ManagerEvidenceFile must be mounted behind the evidence management role middleware.
func ManagerEvidenceFile(db *gorm.DB, objectStorage storage.Storage) gin.HandlerFunc {
	return evidenceFile(db, objectStorage, true)
}

func evidenceFile(db *gorm.DB, objectStorage storage.Storage, manager bool) gin.HandlerFunc {
	return func(c *gin.Context) {
		query, ok := accessibleEvidence(c, db, manager)
		if !ok {
			return
		}
		var row struct {
			Data      string
			ObjectKey string
			Filename  string
			MIME      string
		}
		result := query.
			Joins("LEFT JOIN evidence_upload eu ON eu.evidence_id=e.id").
			Select("e.data, COALESCE(eu.object_key,'') AS object_key, COALESCE(eu.filename,'') AS filename, COALESCE(eu.mime_type,'') AS mime").
			Scan(&row)
		if result.Error != nil {
			c.JSON(500, gin.H{"message": "Không thể tải ảnh minh chứng."})
			return
		}
		if result.RowsAffected == 0 {
			c.JSON(404, gin.H{"message": "Không tìm thấy tệp minh chứng."})
			return
		}

		if row.ObjectKey != "" {
			object, err := objectStorage.Get(c.Request.Context(), row.ObjectKey)
			if err != nil {
				c.JSON(502, gin.H{"message": "Không thể tải ảnh minh chứng từ kho lưu trữ."})
				return
			}
			defer object.Close()
			c.Header("X-Content-Type-Options", "nosniff")
			c.Header("Cache-Control", "private, no-store")
			c.Header("Content-Disposition", mime.FormatMediaType("inline", map[string]string{"filename": row.Filename}))
			c.DataFromReader(http.StatusOK, -1, row.MIME, object, nil)
			return
		}

		parsed := parseEvidenceDataJSON(row.Data)
		if parsed == nil || parsed.DataURL == "" {
			c.JSON(404, gin.H{"message": "Minh chứng này không có ảnh đính kèm."})
			return
		}

		// Tách base64 từ data-URL: "data:<mime>;base64,<b64>"
		parts := strings.SplitN(parsed.DataURL, ",", 2)
		if len(parts) != 2 {
			c.JSON(500, gin.H{"message": "Dữ liệu ảnh bị lỗi."})
			return
		}
		imgBytes, err := base64.StdEncoding.DecodeString(parts[1])
		if err != nil {
			c.JSON(500, gin.H{"message": "Không thể giải mã ảnh."})
			return
		}
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("Cache-Control", "private, no-store")
		c.Header("Content-Disposition", mime.FormatMediaType("inline", map[string]string{"filename": parsed.Filename}))
		c.Data(200, parsed.MIME, imgBytes)
	}
}
