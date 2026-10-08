package handler

import (
	"errors"
	"net/http"

	"renluyen-dlu-backend/internal/service"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type ProfileHandler struct {
	service service.ProfileService
}

func NewProfileHandler(profileService service.ProfileService) *ProfileHandler {
	return &ProfileHandler{service: profileService}
}

func (h *ProfileHandler) GetStudentProfile(c *gin.Context) {
	profile, err := h.service.GetStudentProfile(c.Request.Context(), c.Param("code"))
	if err != nil {
		writeProfileError(c, err, "Không thể lấy thông tin sinh viên")
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Lấy thông tin sinh viên thành công",
		"data":    profile,
	})
}

func (h *ProfileHandler) GetLecturerProfile(c *gin.Context) {
	profile, err := h.service.GetLecturerProfile(c.Request.Context(), c.Param("code"))
	if err != nil {
		writeProfileError(c, err, "Không thể lấy thông tin giảng viên")
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Lấy thông tin giảng viên thành công",
		"data":    profile,
	})
}

func writeProfileError(c *gin.Context, err error, internalMessage string) {
	switch {
	case errors.Is(err, service.ErrProfileCodeRequired):
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
	case errors.Is(err, gorm.ErrRecordNotFound):
		c.JSON(http.StatusNotFound, gin.H{
			"status":  "error",
			"message": "Không tìm thấy hồ sơ",
		})
	default:
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": internalMessage,
		})
	}
}
