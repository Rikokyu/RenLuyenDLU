package handler

import (
	"net/http"

	"renluyen-dlu-backend/internal/repository"

	"github.com/gin-gonic/gin"
)

type DashboardHandler struct {
	repository repository.DashboardRepository
}

func NewDashboardHandler(repository repository.DashboardRepository) *DashboardHandler {
	return &DashboardHandler{repository: repository}
}

func (h *DashboardHandler) GetOverview(c *gin.Context) {
	userID, userOK := c.Get("userID")
	id, validID := userID.(int64)
	roleValue, roleOK := c.Get("role")
	role, validRole := roleValue.(string)
	if !userOK || !validID || id <= 0 || !roleOK || !validRole {
		c.JSON(http.StatusUnauthorized, gin.H{"status": "error", "message": "Phiên đăng nhập không hợp lệ"})
		return
	}
	overview, err := h.repository.GetOverview(c.Request.Context(), id, role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Không thể tải tổng quan theo phạm vi tài khoản: " + err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "success", "data": overview})
}
