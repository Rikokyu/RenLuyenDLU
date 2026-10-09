package main

import (
	"net/http"

	"renluyen-dlu-backend/internal/app"
	"renluyen-dlu-backend/internal/config"
	"renluyen-dlu-backend/internal/middleware"
	"renluyen-dlu-backend/internal/routes"

	"github.com/gin-gonic/gin"
)

func main() {
	// 1. Load Cấu hình
	cfg := config.LoadConfig()

	// 2. Kết nối & Kiểm tra Database
	db := app.InitDatabase(cfg)

	// 3. Khởi tạo Gin Framework
	r := gin.Default()
	routes.SetupRoutes(r, db, cfg)
	r.Use(middleware.CORSMiddleware())

	// 4. API Endpoint kiểm tra Trạng thái Server & DB
	r.GET("/ping", func(c *gin.Context) {
		sqlDB, err := db.DB()
		dbStatus := "Connected (Đã kết nối)"

		if err != nil || sqlDB.Ping() != nil {
			dbStatus = "Disconnected (Mất kết nối)"
		}

		c.JSON(http.StatusOK, gin.H{
			"status":          "success",
			"message":         "Server RenLuyenDLU đang hoạt động!",
			"database_status": dbStatus,
		})
	})

	// 5. Khởi chạy Server
	r.Run(":" + cfg.AppPort)
}
