package middleware

import (
	"net/http"
	"strings"

	"renluyen-dlu-backend/internal/service"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func RequireAuth(auth service.AuthService, db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := strings.TrimSpace(c.GetHeader("Authorization"))
		if !strings.HasPrefix(header, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "Vui lòng đăng nhập."})
			return
		}
		userID, role, err := auth.ValidateToken(strings.TrimSpace(strings.TrimPrefix(header, "Bearer ")))
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "Phiên đăng nhập không hợp lệ hoặc đã hết hạn."})
			return
		}
		var account struct {
			ID   int64  `gorm:"column:id"`
			Role string `gorm:"column:role"`
		}
		err = db.WithContext(c.Request.Context()).Raw(
			`
			SELECT
				u.id,
				CASE
					WHEN u.idrole = 1 THEN 'ADMIN'
					WHEN u.idrole = 2 THEN 'STUDENT_AFFAIRS_ASSISTANT'
					WHEN u.idrole = 3 AND EXISTS (SELECT 1 FROM lecturer l WHERE l.iduser = u.id) THEN 'HOMEROOM_TEACHER'
					WHEN u.idrole = 3 AND EXISTS (
						SELECT 1
						FROM user_post up
						JOIN post p ON p.id = up.idpost
						WHERE up.iduser = u.id AND p.status = 1
					) THEN 'CLASS_OFFICER'
					WHEN u.idrole = 3 THEN 'HOMEROOM_TEACHER'
					ELSE 'STUDENT'
				END AS role
			FROM "User" u
			WHERE u.id = ? AND COALESCE(u.status, 1) <> 0
			`,
			userID,
		).Scan(&account).Error
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"message": "Không thể xác minh tài khoản."})
			return
		}
		if account.ID == 0 {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "Tài khoản đã bị khóa hoặc không còn tồn tại."})
			return
		}
		if account.Role != role {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "Quyền tài khoản đã thay đổi. Vui lòng đăng nhập lại."})
			return
		}
		c.Set("userID", userID)
		c.Set("role", role)
		c.Next()
	}
}

func AllowRoles(roles ...string) gin.HandlerFunc {
	allowed := make(map[string]struct{}, len(roles))
	for _, role := range roles {
		allowed[role] = struct{}{}
	}
	return func(c *gin.Context) {
		role, _ := c.Get("role")
		roleName, ok := role.(string)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "Phiên đăng nhập không hợp lệ."})
			return
		}
		if _, ok := allowed[roleName]; !ok {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"message": "Bạn không có quyền thực hiện thao tác này."})
			return
		}
		c.Next()
	}
}
