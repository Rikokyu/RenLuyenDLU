package routes

import (
	"renluyen-dlu-backend/internal/handler"
	"renluyen-dlu-backend/internal/repository"
	"renluyen-dlu-backend/internal/service"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// MapEvidenceRoutes đăng ký các API endpoint cho tính năng Quản lý Minh chứng
func MapEvidenceRoutes(rg *gin.RouterGroup, db *gorm.DB) {
	// 1. Khởi tạo Dependency Injection cho module Evidence
	evidenceRepo := repository.NewEvidenceRepository(db)
	evidenceService := service.NewEvidenceService(evidenceRepo)
	evidenceHandler := handler.NewEvidenceHandler(evidenceService)

	// 2. Gom nhóm các đường dẫn /evidences
	evidences := rg.Group("/evidences")
	{
		evidences.GET("", evidenceHandler.GetEvidences)                     // GET  /api/v1/evidences
		evidences.GET("/stats", evidenceHandler.GetEvidenceStats)           // GET  /api/v1/evidences/stats
		evidences.GET("/filters", evidenceHandler.GetEvidenceFilterOptions) // GET /api/v1/evidences/filters
		evidences.GET("/detail", evidenceHandler.GetEvidenceDetail)         // GET  /api/v1/evidences/detail
		evidences.PUT("/status", evidenceHandler.UpdateEvidenceStatus)      // PUT /api/v1/evidences/status
		evidences.PUT("/approve", evidenceHandler.ApproveEvidenceList)      // PUT /api/v1/evidences/approve
	}
}
