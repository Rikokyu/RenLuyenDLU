package handler

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type StudentEvidenceRow struct {
	ID           int64  `json:"id"`
	StudentName  string `json:"studentName"`
	StudentID    string `json:"studentId"`
	FacultyClass string `json:"facultyClass"`
	Event        string `json:"event"`
	ActivityCode string `json:"activityCode"`
	SubmitDate   string `json:"submitDate"`
	ProofName    string `json:"proofName"`
	Score        int    `json:"score"`
	StatusCode   int    `json:"statusCode"`
	Description  string `json:"description"`
}

// StudentEvidenceList returns only the selected user's evidence, never a global list.
func StudentEvidenceList(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetInt64("userID")
		if value := c.Query("user_id"); value != "" {
			requested, err := strconv.ParseInt(value, 10, 64)
			if err != nil || requested <= 0 {
				c.JSON(400, gin.H{"message": "Mã người dùng không hợp lệ."})
				return
			}
			role := c.GetString("role")
			if requested != userID && role != "ADMIN" && role != "STUDENT_AFFAIRS_ASSISTANT" {
				c.JSON(403, gin.H{"message": "Bạn chỉ được xem minh chứng của mình."})
				return
			}
			userID = requested
		}
		statusValue := c.Query("status")
		status := 0
		if statusValue != "" {
			var err error
			status, err = strconv.Atoi(statusValue)
			if err != nil || status < 0 || status > 3 {
				c.JSON(400, gin.H{"message": "Trạng thái minh chứng không hợp lệ."})
				return
			}
		}
		from, to := c.Query("from_date"), c.Query("to_date")
		for _, value := range []string{from, to} {
			if value != "" {
				if _, err := time.Parse("2006-01-02", value); err != nil {
					c.JSON(400, gin.H{"message": "Ngày không hợp lệ."})
					return
				}
			}
		}
		if from != "" && to != "" && from > to {
			c.JSON(400, gin.H{"message": "Ngày bắt đầu không được sau ngày kết thúc."})
			return
		}
		columns := map[string]string{"score": "a.score", "date": "e.submitat"}
		column, ok := columns[c.DefaultQuery("sort_by", "date")]
		direction := c.DefaultQuery("sort_order", "desc")
		if !ok || (direction != "asc" && direction != "desc") {
			c.JSON(400, gin.H{"message": "Kiểu sắp xếp không hợp lệ."})
			return
		}
		base := func() *gorm.DB {
			return db.WithContext(c.Request.Context()).Table("evidence e").Joins("JOIN activity_registration ar ON ar.id=e.idacregis").Joins("JOIN student s ON s.id=ar.idstudent").Joins(`JOIN "User" u ON u.id=s.iduser`).Joins("JOIN activity a ON a.id=ar.idactivity").Where("u.id = ?", userID)
		}
		var counts []struct {
			Status int
			Count  int64
		}
		if err := base().Select("e.status, count(*) AS count").Group("e.status").Scan(&counts).Error; err != nil {
			c.JSON(500, gin.H{"message": "Không thể thống kê minh chứng."})
			return
		}
		stats := map[string]int64{"total": 0, "pending": 0, "approved": 0, "rejected": 0, "needMore": 0}
		names := map[int]string{0: "pending", 1: "approved", 2: "rejected", 3: "needMore"}
		for _, row := range counts {
			stats["total"] += row.Count
			if name, ok := names[row.Status]; ok {
				stats[name] += row.Count
			}
		}
		query := base().Joins("LEFT JOIN class cl ON cl.id=s.idclass")
		if statusValue != "" {
			query = query.Where("e.status = ?", status)
		}
		if search := strings.TrimSpace(c.Query("search")); search != "" {
			pattern := "%" + strings.NewReplacer("\\", "\\\\", "%", "\\%", "_", "\\_").Replace(search) + "%"
			query = query.Where("(a.title ILIKE ? OR a.activity_code ILIKE ?)", pattern, pattern)
		}
		if from != "" {
			query = query.Where("e.submitat >= CAST(? AS date)", from)
		}
		if to != "" {
			query = query.Where("e.submitat < CAST(? AS date) + INTERVAL '1 day'", to)
		}
		rows := []StudentEvidenceRow{}
		err := query.Select(`e.id, concat_ws(' ', u.firstname, u.lastname) AS student_name, s.student_code AS student_id, COALESCE(cl.name,'') AS faculty_class, a.title AS event, a.activity_code, COALESCE(to_char(e.submitat, 'YYYY-MM-DD'),'') AS submit_date, e.data AS proof_name, a.score, e.status AS status_code, a.detail AS description`).Order(column + " " + direction + " NULLS LAST, e.id ASC").Scan(&rows).Error
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Không thể tải minh chứng."})
			return
		}
		for i := range rows {
			if parsed := parseEvidenceDataJSON(rows[i].ProofName); parsed != nil {
				rows[i].ProofName = parsed.Filename
			}
		}
		c.JSON(200, gin.H{"data": rows, "stats": stats, "userId": userID})
	}
}
