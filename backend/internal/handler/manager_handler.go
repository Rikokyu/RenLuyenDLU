package handler

import (
	"errors"
	"net/http"
	"strconv"

	"renluyen-dlu-backend/internal/dto"
	"renluyen-dlu-backend/internal/service"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type ManagerHandler struct {
	service service.ManagerService
}

func NewManagerHandler(
	service service.ManagerService,
) *ManagerHandler {
	return &ManagerHandler{
		service: service,
	}
}

func (h *ManagerHandler) GetStudents(c *gin.Context) {

	var req dto.ManagerStudentQuery

	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Dữ liệu tìm kiếm không hợp lệ",
		})
		return
	}

	students, err := h.service.GetStudents(
		c.Request.Context(),
		req,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Không thể lấy danh sách sinh viên: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Lấy danh sách sinh viên thành công",
		"data":    students,
	})
}

func (h *ManagerHandler) GetClasses(c *gin.Context) {
	classes, err := h.service.GetClasses(c.Request.Context())
	if err != nil {
		writeManagerError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "success", "data": classes})
}

func (h *ManagerHandler) GetAccounts(c *gin.Context) {
	accounts, err := h.service.GetAccounts(c.Request.Context())
	if err != nil {
		writeManagerError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "success", "data": accounts})
}

func (h *ManagerHandler) GetRoles(c *gin.Context) {
	roles, err := h.service.GetRoles(c.Request.Context())
	if err != nil {
		writeManagerError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "success", "data": roles})
}

func (h *ManagerHandler) SaveAccount(c *gin.Context) {
	id, err := optionalPathID(c, "id")
	if err != nil {
		writeManagerError(c, err)
		return
	}
	var account dto.ManagerAccountMutation
	if err := c.ShouldBindJSON(&account); err != nil {
		writeManagerError(c, err)
		return
	}
	if err := h.service.SaveAccount(c.Request.Context(), id, account); err != nil {
		writeManagerError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Đã lưu tài khoản"})
}

func (h *ManagerHandler) DeleteAccount(c *gin.Context) {
	id, err := optionalPathID(c, "id")
	if err != nil || id == 0 {
		writeManagerError(c, errors.New("mã tài khoản không hợp lệ"))
		return
	}
	if err := h.service.DeleteAccount(c.Request.Context(), id); err != nil {
		writeManagerError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *ManagerHandler) ResetAccountPassword(c *gin.Context) {
	id, err := optionalPathID(c, "id")
	if err != nil || id == 0 {
		writeManagerError(c, errors.New("mã tài khoản không hợp lệ"))
		return
	}
	if err := h.service.ResetAccountPassword(c.Request.Context(), id); err != nil {
		writeManagerError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Đã đặt lại mật khẩu mặc định"})
}

func (h *ManagerHandler) SaveClass(c *gin.Context) {
	var class dto.ManagerClassMutation
	if err := c.ShouldBindJSON(&class); err != nil {
		writeManagerError(c, err)
		return
	}
	if err := h.service.SaveClass(c.Request.Context(), c.Param("code"), class); err != nil {
		writeManagerError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Đã lưu lớp"})
}

func (h *ManagerHandler) DeleteClass(c *gin.Context) {
	if err := h.service.DeleteClass(c.Request.Context(), c.Param("code")); err != nil {
		writeManagerError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *ManagerHandler) SaveStudent(c *gin.Context) {
	var student dto.ManagerStudentMutation
	if err := c.ShouldBindJSON(&student); err != nil {
		writeManagerError(c, err)
		return
	}
	if err := h.service.SaveStudent(c.Request.Context(), c.Param("id"), student); err != nil {
		writeManagerError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Đã lưu sinh viên"})
}

func (h *ManagerHandler) DeleteStudent(c *gin.Context) {
	if err := h.service.DeleteStudent(c.Request.Context(), c.Param("id")); err != nil {
		writeManagerError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

func optionalPathID(c *gin.Context, key string) (int64, error) {
	value := c.Param(key)
	if value == "" {
		return 0, nil
	}
	return strconv.ParseInt(value, 10, 64)
}

func writeManagerError(c *gin.Context, err error) {
	status := http.StatusBadRequest
	if errors.Is(err, gorm.ErrRecordNotFound) {
		status = http.StatusNotFound
	}
	c.JSON(status, gin.H{"status": "error", "message": err.Error()})
}
