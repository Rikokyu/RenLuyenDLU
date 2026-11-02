package handler

import (
	"errors"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"renluyen-dlu-backend/internal/repository"
	"renluyen-dlu-backend/internal/service"
)

type ReportHandler struct{ repository repository.ReportRepository }

func NewReportHandler(repo repository.ReportRepository) *ReportHandler {
	return &ReportHandler{repository: repo}
}

func (h *ReportHandler) GetOverview(c *gin.Context) {
	userID, ok := c.Get("userID")
	id, valid := userID.(int64)
	if !ok || !valid || id <= 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Phiên đăng nhập không hợp lệ"})
		return
	}
	role := c.GetString("role")
	if role != "ADMIN" && role != "STUDENT_AFFAIRS_ASSISTANT" {
		c.JSON(http.StatusForbidden, gin.H{"message": "Bạn không có quyền xem báo cáo quản lý"})
		return
	}
	now := time.Now()
	period, previous, err := service.ResolveReportPeriods(c.Query("from_date"), c.Query("to_date"), now)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	result, err := h.repository.GetReportOverview(c.Request.Context(), id, role, period, previous, now)
	if err != nil {
		if errors.Is(err, repository.ErrReportForbidden) {
			c.JSON(http.StatusForbidden, gin.H{"message": "Tài khoản chưa có phạm vi báo cáo hợp lệ"})
			return
		}
		log.Printf("report overview: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Không thể tải báo cáo. Vui lòng thử lại."})
		return
	}
	service.CompleteReportOverview(result)
	c.JSON(http.StatusOK, gin.H{"status": "success", "data": result})
}
