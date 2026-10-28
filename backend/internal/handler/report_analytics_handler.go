package handler

import (
	"errors"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"renluyen-dlu-backend/internal/model"
	"renluyen-dlu-backend/internal/repository"
	"renluyen-dlu-backend/internal/service"
)

func ReportAnalytics(repo repository.ReportAnalyticsRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, ok := c.Get("userID")
		userID, valid := id.(int64)
		if !ok || !valid || userID <= 0 {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "Phiên đăng nhập không hợp lệ"})
			return
		}
		role := c.GetString("role")
		if role != "ADMIN" && role != "STUDENT_AFFAIRS_ASSISTANT" {
			c.JSON(http.StatusForbidden, gin.H{"message": "Bạn không có quyền xem báo cáo quản lý"})
			return
		}
		q, err := parseAnalyticsQuery(c, time.Now())
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
			return
		}
		result, err := repo.GetAnalytics(c.Request.Context(), userID, role, q, time.Now())
		if err != nil {
			if errors.Is(err, repository.ErrReportSemesterNotFound) {
				c.JSON(http.StatusBadRequest, gin.H{"message": "Học kỳ không tồn tại"})
				return
			}
			if errors.Is(err, repository.ErrReportForbidden) {
				c.JSON(http.StatusForbidden, gin.H{"message": "Không có quyền truy cập phạm vi báo cáo"})
				return
			}
			log.Printf("report analytics: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Không thể tải phân tích báo cáo. Vui lòng thử lại."})
			return
		}
		c.JSON(http.StatusOK, gin.H{"status": "success", "data": result})
	}
}

func parseAnalyticsQuery(c *gin.Context, now time.Time) (model.ReportAnalyticsQuery, error) {
	q := model.ReportAnalyticsQuery{Page: 1, PageSize: 5, TopLimit: 5, Sort: "attended"}
	values, parseErr := url.ParseQuery(c.Request.URL.RawQuery)
	if parseErr != nil {
		return q, fmt.Errorf("chuỗi tham số truy vấn không hợp lệ")
	}
	for _, name := range []string{"from_date", "to_date", "school_year_id", "page", "page_size", "top_limit", "sort"} {
		if entries, exists := values[name]; exists && (len(entries) != 1 || entries[0] == "") {
			return q, fmt.Errorf("%s phải có một giá trị không rỗng", name)
		}
	}
	p, _, err := service.ResolveReportPeriods(c.Query("from_date"), c.Query("to_date"), now)
	if err != nil {
		return q, err
	}
	q.Period = p
	for _, field := range []struct {
		name   string
		target *int
		max    int
	}{{"page", &q.Page, 1000000}, {"page_size", &q.PageSize, 100}, {"top_limit", &q.TopLimit, 50}} {
		if value, exists := c.GetQuery(field.name); exists {
			n, err := strconv.Atoi(value)
			if err != nil || n < 1 || n > field.max {
				return q, fmt.Errorf("%s phải từ 1 đến %d", field.name, field.max)
			}
			*field.target = n
		}
	}
	if value, exists := c.GetQuery("school_year_id"); exists {
		n, err := strconv.ParseInt(value, 10, 64)
		if err != nil || n <= 0 {
			return q, fmt.Errorf("school_year_id phải là số nguyên dương")
		}
		q.SchoolYearID = n
	}
	if value, exists := c.GetQuery("sort"); exists {
		if value != "attended" && value != "registered" && value != "no_show" {
			return q, fmt.Errorf("sort phải là attended, registered hoặc no_show")
		}
		q.Sort = value
	}
	return q, nil
}
