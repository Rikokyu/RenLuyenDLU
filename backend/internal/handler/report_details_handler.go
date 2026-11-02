package handler

import (
	"errors"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"unicode/utf8"

	"github.com/gin-gonic/gin"
	"renluyen-dlu-backend/internal/model"
	"renluyen-dlu-backend/internal/repository"
)

func ReportDetails(repo repository.ReportDetailsRepository) gin.HandlerFunc {
	return reportDetails(repo, false)
}

func ReportDetailsExport(repo repository.ReportDetailsRepository) gin.HandlerFunc {
	return reportDetails(repo, true)
}

func reportDetails(repo repository.ReportDetailsRepository, export bool) gin.HandlerFunc {
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
		q, err := parseReportDetailQuery(c.Request.URL.RawQuery)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
			return
		}
		q.Export = export
		result, err := repo.GetDetails(c.Request.Context(), userID, role, q)
		if err != nil {
			if errors.Is(err, repository.ErrReportExportTooLarge) {
				c.JSON(http.StatusRequestEntityTooLarge, gin.H{"message": "Danh sách vượt quá 50.000 dòng. Vui lòng lọc theo khoa, ngành hoặc lớp trước khi xuất."})
				return
			}
			log.Printf("report details: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Không thể tải danh sách báo cáo. Vui lòng thử lại."})
			return
		}
		c.Header("Cache-Control", "no-store")
		c.JSON(http.StatusOK, gin.H{"status": "success", "data": result})
	}
}
func parseReportDetailQuery(raw string) (model.ReportDetailQuery, error) {
	q := model.ReportDetailQuery{Page: 1, PageSize: 10}
	values, err := url.ParseQuery(raw)
	if err != nil {
		return q, fmt.Errorf("tham số truy vấn không hợp lệ")
	}
	for name, entries := range values {
		if len(entries) != 1 {
			return q, fmt.Errorf("%s không được lặp lại", name)
		}
	}
	q.Search = strings.TrimSpace(values.Get("search"))
	if utf8.RuneCountInString(q.Search) > 200 {
		return q, fmt.Errorf("từ khóa tối đa 200 ký tự")
	}
	for _, field := range []struct {
		name   string
		target *int64
	}{{"faculty_id", &q.FacultyID}, {"major_id", &q.MajorID}, {"class_id", &q.ClassID}} {
		if v, ok := values[field.name]; ok {
			n, err := strconv.ParseInt(v[0], 10, 64)
			if err != nil || n <= 0 {
				return q, fmt.Errorf("%s phải là số nguyên dương", field.name)
			}
			*field.target = n
		}
	}
	for _, field := range []struct {
		name   string
		target *int
		max    int
	}{{"page", &q.Page, 1000000}, {"page_size", &q.PageSize, 100}} {
		if v, ok := values[field.name]; ok {
			n, err := strconv.Atoi(v[0])
			if err != nil || n < 1 || n > field.max {
				return q, fmt.Errorf("%s phải từ 1 đến %d", field.name, field.max)
			}
			*field.target = n
		}
	}
	return q, nil
}
