package routes

import (
	"renluyen-dlu-backend/internal/handler"
	"renluyen-dlu-backend/internal/middleware"
	"renluyen-dlu-backend/internal/repository"
	"renluyen-dlu-backend/internal/service"
	"renluyen-dlu-backend/internal/storage"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func MapActivityRoutes(
	rg *gin.RouterGroup,
	db *gorm.DB,
	authMiddleware gin.HandlerFunc,
	imageStorage storage.ActivityImages,
) {
	activityRepo := repository.NewActivityRepository(db)
	activityService := service.NewActivityService(activityRepo, imageStorage)
	activityHandler := handler.NewActivityHandler(activityService)

	activities := rg.Group("/activities")
	activities.Use(authMiddleware)
	{
		activities.GET("", activityHandler.ListActivities)
		activities.GET("/:id", activityHandler.GetActivity)
		activities.GET("/:id/image", activityHandler.GetActivityImage)
	}

	managers := activities.Group("")
	managers.Use(middleware.AllowRoles("ADMIN", "STUDENT_AFFAIRS_ASSISTANT", "HOMEROOM_TEACHER"))
	managers.POST("", activityHandler.CreateActivity)
	managers.PUT("/:id", activityHandler.UpdateActivity)
	managers.DELETE("/:id", activityHandler.DeleteActivity)
	managers.POST("/:id/image", activityHandler.UploadActivityImage)

	students := activities.Group("")
	students.Use(middleware.AllowRoles("STUDENT", "CLASS_OFFICER"))
	students.POST("/:id/registrations", activityHandler.RegisterStudent)
}
