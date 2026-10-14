package handler

import (
	"errors"
	"net/http"

	"renluyen-dlu-backend/internal/dto"
	"renluyen-dlu-backend/internal/service"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type AuthHandler struct {
	service service.AuthService
}

func NewAuthHandler(authService service.AuthService) *AuthHandler {
	return &AuthHandler{service: authService}
}

type loginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type googleLoginRequest struct {
	Credential string `json:"credential" binding:"required"`
}

type changePasswordRequest struct {
	OldPassword string `json:"oldPassword" binding:"required"`
	NewPassword string `json:"newPassword" binding:"required"`
}

func (h *AuthHandler) Login(c *gin.Context) {
	var request loginRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Vui lòng nhập tên đăng nhập và mật khẩu."})
		return
	}
	result, err := h.service.Login(c.Request.Context(), request.Username, request.Password)
	if err != nil {
		if errors.Is(err, service.ErrInvalidCredentials) {
			c.JSON(http.StatusUnauthorized, gin.H{"message": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Không thể đăng nhập lúc này."})
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *AuthHandler) GoogleLogin(c *gin.Context) {
	var request googleLoginRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Thiếu Google credential."})
		return
	}
	result, err := h.service.LoginWithGoogle(c.Request.Context(), request.Credential)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrGoogleNotConfigured):
			c.JSON(http.StatusServiceUnavailable, gin.H{"message": err.Error()})
		case errors.Is(err, service.ErrInvalidGoogleUser):
			c.JSON(http.StatusUnauthorized, gin.H{"message": err.Error()})
		default:
			c.JSON(http.StatusBadGateway, gin.H{"message": "Không thể xác minh tài khoản Google."})
		}
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *AuthHandler) ChangePassword(c *gin.Context) {
	var request changePasswordRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Vui lòng nhập đủ mật khẩu hiện tại và mật khẩu mới."})
		return
	}
	userID, exists := c.Get("userID")
	parsedUserID, validUserID := userID.(int64)
	if !exists || !validUserID {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Phiên đăng nhập không hợp lệ."})
		return
	}
	if err := h.service.ChangePassword(c.Request.Context(), parsedUserID, request.OldPassword, request.NewPassword); err != nil {
		switch {
		case errors.Is(err, service.ErrInvalidPassword):
			c.JSON(http.StatusUnauthorized, gin.H{"message": err.Error()})
		case errors.Is(err, service.ErrWeakPassword), errors.Is(err, service.ErrSamePassword):
			c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Không thể cập nhật mật khẩu lúc này."})
		}
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Đổi mật khẩu thành công."})
}

func (h *AuthHandler) Profile(c *gin.Context) {
	userID, exists := c.Get("userID")
	parsedUserID, validUserID := userID.(int64)
	if !exists || !validUserID {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Phiên đăng nhập không hợp lệ."})
		return
	}
	profile, err := h.service.GetProfile(c.Request.Context(), parsedUserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Không thể tải hồ sơ người dùng."})
		return
	}
	c.JSON(http.StatusOK, profile)
}

func (h *AuthHandler) UpdateProfile(c *gin.Context) {
	userID, exists := c.Get("userID")
	parsedUserID, validUserID := userID.(int64)
	if !exists || !validUserID || parsedUserID <= 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Phiên đăng nhập không hợp lệ."})
		return
	}
	var input dto.ProfileMutation
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Vui lòng nhập đầy đủ thông tin hồ sơ bắt buộc."})
		return
	}
	profile, err := h.service.UpdateProfile(c.Request.Context(), parsedUserID, input)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrInvalidProfile):
			c.JSON(http.StatusBadRequest, gin.H{"message": "Họ tên, giới tính, ngày sinh và số điện thoại phải hợp lệ; ngày sinh không được ở tương lai."})
		case errors.Is(err, gorm.ErrRecordNotFound):
			c.JSON(http.StatusNotFound, gin.H{"message": "Không tìm thấy tài khoản đang hoạt động."})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Không thể cập nhật hồ sơ người dùng."})
		}
		return
	}
	c.JSON(http.StatusOK, profile)
}
