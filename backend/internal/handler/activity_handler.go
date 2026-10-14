package handler

import (
	"errors"
	"io"
	"net/http"
	"strconv"

	"renluyen-dlu-backend/internal/dto"
	"renluyen-dlu-backend/internal/service"
	"renluyen-dlu-backend/internal/storage"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type ActivityHandler struct {
	service service.ActivityService
}

func NewActivityHandler(activityService service.ActivityService) *ActivityHandler {
	return &ActivityHandler{service: activityService}
}

func (h *ActivityHandler) ListActivities(c *gin.Context) {
	var query dto.ActivityQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Bộ lọc hoạt động không hợp lệ"})
		return
	}
	items, total, err := h.service.ListActivities(c.Request.Context(), query)
	if err != nil {
		writeActivityError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   items,
		"total":  total,
	})
}

func (h *ActivityHandler) GetActivity(c *gin.Context) {
	id, err := activityPathID(c)
	if err != nil {
		writeActivityError(c, err)
		return
	}
	item, err := h.service.GetActivity(c.Request.Context(), id)
	if err != nil {
		writeActivityError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "success", "data": item})
}

func (h *ActivityHandler) CreateActivity(c *gin.Context) {
	var input dto.ActivityMutation
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Dữ liệu hoạt động không hợp lệ: " + err.Error()})
		return
	}
	userID, ok := activityAuthenticatedUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"status": "error", "message": "Phiên đăng nhập không hợp lệ"})
		return
	}
	input.UserID = userID
	item, err := h.service.CreateActivity(c.Request.Context(), input)
	if err != nil {
		writeActivityError(c, err)
		return
	}
	c.JSON(http.StatusCreated, gin.H{"status": "success", "data": item})
}

func (h *ActivityHandler) UpdateActivity(c *gin.Context) {
	id, err := activityPathID(c)
	if err != nil {
		writeActivityError(c, err)
		return
	}
	var input dto.ActivityMutation
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Dữ liệu hoạt động không hợp lệ: " + err.Error()})
		return
	}
	userID, ok := activityAuthenticatedUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"status": "error", "message": "Phiên đăng nhập không hợp lệ"})
		return
	}
	input.UserID = userID
	item, err := h.service.UpdateActivity(c.Request.Context(), id, input)
	if err != nil {
		writeActivityError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "success", "data": item})
}

func (h *ActivityHandler) DeleteActivity(c *gin.Context) {
	id, err := activityPathID(c)
	if err != nil {
		writeActivityError(c, err)
		return
	}
	userID, ok := activityAuthenticatedUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"status": "error", "message": "Phiên đăng nhập không hợp lệ"})
		return
	}
	if err := h.service.DeleteActivity(c.Request.Context(), id, userID); err != nil {
		writeActivityError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Đã ngừng hoạt động; dữ liệu đăng ký được giữ lại"})
}

func (h *ActivityHandler) RegisterStudent(c *gin.Context) {
	id, err := activityPathID(c)
	if err != nil {
		writeActivityError(c, err)
		return
	}
	userID, ok := activityAuthenticatedUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"status": "error", "message": "Phiên đăng nhập không hợp lệ"})
		return
	}
	result, err := h.service.RegisterStudent(c.Request.Context(), id, userID)
	if err != nil {
		writeActivityError(c, err)
		return
	}
	c.JSON(http.StatusCreated, gin.H{"status": "success", "data": result})
}

func (h *ActivityHandler) UploadActivityImage(c *gin.Context) {
	id, err := activityPathID(c)
	if err != nil {
		writeActivityError(c, err)
		return
	}
	userID, ok := activityAuthenticatedUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"status": "error", "message": "Phiên đăng nhập không hợp lệ"})
		return
	}
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 6*1024*1024)
	file, header, err := c.Request.FormFile("image")
	if err != nil {
		var maxBytesError *http.MaxBytesError
		if errors.As(err, &maxBytesError) {
			c.JSON(http.StatusRequestEntityTooLarge, gin.H{"status": "error", "message": "Ảnh phải có dung lượng tối đa 5 MB"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Vui lòng chọn ảnh hoạt động"})
		return
	}
	defer file.Close()
	if header.Size <= 0 || header.Size > 5*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Ảnh phải có dung lượng từ 1 byte đến 5 MB"})
		return
	}
	data, err := io.ReadAll(io.LimitReader(file, 5*1024*1024+1))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Không thể đọc tệp ảnh"})
		return
	}
	contentType, err := h.service.UploadActivityImage(c.Request.Context(), userID, id, data)
	if err != nil {
		writeActivityError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"status":      "success",
		"contentType": contentType,
	})
}

func (h *ActivityHandler) GetActivityImage(c *gin.Context) {
	id, err := activityPathID(c)
	if err != nil {
		writeActivityError(c, err)
		return
	}
	data, contentType, err := h.service.GetActivityImage(c.Request.Context(), id)
	if err != nil {
		writeActivityError(c, err)
		return
	}
	c.Data(http.StatusOK, contentType, data)
}

func activityPathID(c *gin.Context) (int64, error) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id <= 0 {
		return 0, service.ErrInvalidActivity
	}
	return id, nil
}

func activityAuthenticatedUserID(c *gin.Context) (int64, bool) {
	value, exists := c.Get("userID")
	userID, ok := value.(int64)
	return userID, exists && ok && userID > 0
}

func writeActivityError(c *gin.Context, err error) {
	status := http.StatusInternalServerError
	message := "Không thể xử lý yêu cầu hoạt động"
	switch {
	case errors.Is(err, service.ErrInvalidActivity):
		status, message = http.StatusBadRequest, err.Error()
	case errors.Is(err, service.ErrInvalidActivityImage):
		status, message = http.StatusBadRequest, err.Error()
	case errors.Is(err, storage.ErrImageNotFound):
		status, message = http.StatusNotFound, "Hoạt động chưa có ảnh minh họa"
	case errors.Is(err, service.ErrNotActivityManager):
		status, message = http.StatusForbidden, "Tài khoản quản lý hoạt động đang hoạt động mới được thực hiện thao tác này"
	case errors.Is(err, service.ErrActivityNotOwned):
		status, message = http.StatusForbidden, "Bạn không có quyền quản lý hoạt động này"
	case errors.Is(err, service.ErrActivityCodeConflict):
		status, message = http.StatusConflict, "Mã hoạt động đã tồn tại"
	case errors.Is(err, service.ErrActivityAlreadyRegistered):
		status, message = http.StatusConflict, "Sinh viên đã đăng ký hoạt động này"
	case errors.Is(err, service.ErrActivityFull):
		status, message = http.StatusConflict, "Hoạt động đã đủ số lượng đăng ký"
	case errors.Is(err, service.ErrActivityRegistrationClosed):
		status, message = http.StatusConflict, "Hoạt động đã kết thúc, không thể đăng ký"
	case errors.Is(err, gorm.ErrRecordNotFound):
		status, message = http.StatusNotFound, "Không tìm thấy hoạt động hoặc hồ sơ sinh viên"
	}
	c.JSON(status, gin.H{"status": "error", "message": message})
}
