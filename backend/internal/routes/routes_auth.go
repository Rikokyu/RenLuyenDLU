package routes

import (
	"renluyen-dlu-backend/internal/handler"
	"renluyen-dlu-backend/internal/middleware"
	"renluyen-dlu-backend/internal/service"

	"github.com/gin-gonic/gin"
)

func MapAuthRoutes(rg *gin.RouterGroup, authService service.AuthService, authMiddleware gin.HandlerFunc) {
	authHandler := handler.NewAuthHandler(authService)
	auth := rg.Group("/auth")
	auth.POST("/login", authHandler.Login)
	auth.POST("/google", authHandler.GoogleLogin)

	protected := auth.Group("")
	protected.Use(authMiddleware)
	protected.GET("/me", authHandler.Profile)
	protected.PUT("/me", middleware.AllowRoles("HOMEROOM_TEACHER", "STUDENT_AFFAIRS_ASSISTANT"), authHandler.UpdateProfile)
	protected.PUT("/password", authHandler.ChangePassword)
}
