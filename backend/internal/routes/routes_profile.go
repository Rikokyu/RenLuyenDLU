package routes

import (
	"renluyen-dlu-backend/internal/handler"
	"renluyen-dlu-backend/internal/repository"
	"renluyen-dlu-backend/internal/service"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func MapProfileRoutes(rg *gin.RouterGroup, db *gorm.DB) {
	profileRepository := repository.NewProfileRepository(db)
	profileService := service.NewProfileService(profileRepository)
	profileHandler := handler.NewProfileHandler(profileService)

	profiles := rg.Group("/profiles")
	{
		profiles.GET("/students/:code", profileHandler.GetStudentProfile)
		profiles.GET("/lecturers/:code", profileHandler.GetLecturerProfile)
	}
}
