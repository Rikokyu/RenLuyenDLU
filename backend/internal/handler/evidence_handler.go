package handler

import (
	"errors"
	"net/http"
	"strconv"

	"renluyen-dlu-backend/internal/dto"
	"renluyen-dlu-backend/internal/service"

	"github.com/gin-gonic/gin"
)

type EvidenceHandler struct {
	service service.EvidenceService
}

func NewEvidenceHandler(service service.EvidenceService) *EvidenceHandler {
	return &EvidenceHandler{service: service}
}

// ----------------------------------------------------------------------------
// 1. GET /api/v1/evidences
// Lấy danh sách minh chứng (có lọc, tìm kiếm)
// ----------------------------------------------------------------------------
func (h *EvidenceHandler) GetEvidences(c *gin.Context) {
	var req dto.EvidenceQueryReq

	// Tự động bind Query Parameters từ URL vào struct req
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Dữ liệu yêu cầu không hợp lệ: " + err.Error(),
		})
		return
	}

	evidences, err := h.service.GetEvidences(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Lấy danh sách minh chứng thất bại: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Lấy danh sách minh chứng thành công",
		"data":    evidences,
	})
}

// ----------------------------------------------------------------------------
// 2. GET /api/v1/evidences/stats
// Lấy số liệu cho 4 thẻ thống kê ở trên cùng màn hình
// ----------------------------------------------------------------------------
func (h *EvidenceHandler) GetEvidenceStats(c *gin.Context) {
	stats, err := h.service.GetEvidenceStats(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Lấy dữ liệu thống kê thất bại: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Lấy dữ liệu thống kê thành công",
		"data":    stats,
	})
}

func (h *EvidenceHandler) GetEvidenceFilterOptions(c *gin.Context) {
	options, err := h.service.GetEvidenceFilterOptions(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Lấy danh sách bộ lọc thất bại: " + err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Lấy danh sách bộ lọc thành công",
		"data":    options,
	})
}

// ----------------------------------------------------------------------------
// 3. GET /api/v1/evidences/detail?evidence_id=1
// Lấy thông tin chi tiết 1 minh chứng để hiển thị lên Modal Popup
// ----------------------------------------------------------------------------
func (h *EvidenceHandler) GetEvidenceDetail(c *gin.Context) {
	evidenceID, err := strconv.ParseInt(c.Query("evidence_id"), 10, 64)

	if err != nil || evidenceID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "evidence_id không hợp lệ",
		})
		return
	}

	evidence, err := h.service.GetEvidenceDetail(c.Request.Context(), evidenceID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Lấy chi tiết minh chứng thành công",
		"data":    evidence,
	})
}

// ----------------------------------------------------------------------------
// 4. PUT /api/v1/evidences/status
// Cập nhật trạng thái minh chứng (Duyệt hoặc Hủy/Từ chối)
// ----------------------------------------------------------------------------
func (h *EvidenceHandler) UpdateEvidenceStatus(c *gin.Context) {
	var body dto.UpdateStatusReq

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Dữ liệu gửi lên không đúng định dạng: " + err.Error(),
		})
		return
	}

	err := h.service.UpdateEvidenceStatus(c.Request.Context(), body.EvidenceID, body.Status)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Cập nhật trạng thái minh chứng thành công",
	})
}

func (h *EvidenceHandler) ApproveEvidenceList(c *gin.Context) {
	var body dto.ApproveEvidencesReq
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Danh sách minh chứng không hợp lệ: " + err.Error(),
		})
		return
	}
	updatedCount, err := h.service.ApproveEvidenceList(c.Request.Context(), body.EvidenceIDs)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Đã duyệt toàn bộ minh chứng trong danh sách hiển thị",
		"data":    gin.H{"updated_count": updatedCount},
	})
}

func (h *EvidenceHandler) SubmitEvidence(c *gin.Context) {
	var request struct {
		ActivityID int64  `json:"activityId" binding:"required,gt=0"`
		Data       string `json:"data" binding:"required"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Dữ liệu minh chứng không hợp lệ"})
		return
	}
	userValue, exists := c.Get("userID")
	userID, validID := userValue.(int64)
	if !exists || !validID || userID <= 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"status": "error", "message": "Phiên đăng nhập không hợp lệ"})
		return
	}
	if err := h.service.SubmitEvidence(c.Request.Context(), userID, request.ActivityID, request.Data); err != nil {
		status := http.StatusBadRequest
		if errors.Is(err, service.ErrEvidenceNotRegistered) {
			status = http.StatusForbidden
		} else if errors.Is(err, service.ErrEvidenceWindowClosed) {
			status = http.StatusConflict
		}
		c.JSON(status, gin.H{"status": "error", "message": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"status": "success", "message": "Đã nộp minh chứng"})
}

func (h *EvidenceHandler) GetStudentEvidence(c *gin.Context) {
	activityID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || activityID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Mã hoạt động không hợp lệ"})
		return
	}
	userValue, exists := c.Get("userID")
	userID, validID := userValue.(int64)
	if !exists || !validID || userID <= 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"status": "error", "message": "Phiên đăng nhập không hợp lệ"})
		return
	}
	evidence, err := h.service.GetStudentEvidence(c.Request.Context(), userID, activityID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"status": "error", "message": "Không tìm thấy minh chứng đã kết thúc của hoạt động này"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "success", "data": evidence})
}
