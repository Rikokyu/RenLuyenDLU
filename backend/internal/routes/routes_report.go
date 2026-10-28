package routes

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"renluyen-dlu-backend/internal/handler"
	"renluyen-dlu-backend/internal/repository"
)

// Register only on the authenticated manager group.
func MapReportRoutes(managerRoutes *gin.RouterGroup, db *gorm.DB) {
	h := handler.NewReportHandler(repository.NewReportRepository(db))
	managerRoutes.GET("/reports/overview", h.GetOverview)
	managerRoutes.GET("/reports/analytics", handler.ReportAnalytics(repository.NewReportAnalyticsRepository(db)))
	managerRoutes.GET("/reports/details", handler.ReportDetails(repository.NewReportDetailsRepository(db)))
	managerRoutes.GET("/reports/details/export", handler.ReportDetailsExport(repository.NewReportDetailsRepository(db)))
}
