package routes

import (
	"renluyen-dlu-backend/internal/handler"
	"renluyen-dlu-backend/internal/repository"
	"renluyen-dlu-backend/internal/service"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func MapManagerRoutes(
	rg *gin.RouterGroup,
	db *gorm.DB,
) {

	managerRepo := repository.NewManagerRepository(db)

	managerService := service.NewManagerService(
		managerRepo,
	)

	managerHandler := handler.NewManagerHandler(
		managerService,
	)

	manager := rg.Group("/manager")
	{
		manager.GET("/students", managerHandler.GetStudents)
		manager.POST("/students", managerHandler.SaveStudent)
		manager.PUT("/students/:id", managerHandler.SaveStudent)
		manager.DELETE("/students/:id", managerHandler.DeleteStudent)
		manager.GET("/classes", managerHandler.GetClasses)
		manager.POST("/classes", managerHandler.SaveClass)
		manager.PUT("/classes/:code", managerHandler.SaveClass)
		manager.DELETE("/classes/:code", managerHandler.DeleteClass)
		manager.GET("/accounts", managerHandler.GetAccounts)
		manager.POST("/accounts", managerHandler.SaveAccount)
		manager.PUT("/accounts/:id", managerHandler.SaveAccount)
		manager.DELETE("/accounts/:id", managerHandler.DeleteAccount)
		manager.POST("/accounts/:id/reset-password", managerHandler.ResetAccountPassword)
		manager.GET("/roles", managerHandler.GetRoles)
	}
}
