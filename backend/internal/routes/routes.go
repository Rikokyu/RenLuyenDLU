package routes

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"renluyen-dlu-backend/internal/config"
	"renluyen-dlu-backend/internal/middleware"
	"renluyen-dlu-backend/internal/service"
)

// SetupRoutes khởi tạo toàn bộ router, middleware và đăng ký các module routes
func SetupRoutes(r *gin.Engine, db *gorm.DB, cfg *config.Config) {
	// 1. Cấu hình Middleware toàn cục (Logger, Recovery, CORS, ...)
	r.Use(gin.Logger())
	r.Use(gin.Recovery())

	// Cấu hình CORS cơ bản cho phép Frontend kết nối
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// 2. Kiểm tra trạng thái Server (Health Check)
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"message": "Server đang hoạt động bình thường",
		})
	})

	// 3. Gom nhóm Router Phiên bản 1 (/api/v1)
	v1 := r.Group("/api/v1")
	{
		authService := service.NewAuthService(db, cfg.JWTSecret, cfg.JWTExpireHours, cfg.GoogleClientID)
		authMiddleware := middleware.RequireAuth(authService, db)
		MapAuthRoutes(v1, authService, authMiddleware)

		managerRoutes := v1.Group("")
		managerRoutes.Use(authMiddleware, middleware.AllowRoles("ADMIN", "STUDENT_AFFAIRS_ASSISTANT"))
		MapManagerRoutes(managerRoutes, db)

		evidenceRoutes := v1.Group("")
		evidenceRoutes.Use(
			authMiddleware,
			middleware.AllowRoles("ADMIN", "STUDENT_AFFAIRS_ASSISTANT", "HOMEROOM_TEACHER", "CLASS_OFFICER"),
		)
		MapEvidenceRoutes(evidenceRoutes, db)
	}
	MapSwaggerRoutes(r)
}
