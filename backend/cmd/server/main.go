package main

import (
	"net/http"

	"renluyen-dlu-backend/internal/app"
	"renluyen-dlu-backend/internal/config"
	"renluyen-dlu-backend/internal/middleware"
	"renluyen-dlu-backend/internal/routes"
	"renluyen-dlu-backend/internal/storage"

	"context"
	"github.com/gin-gonic/gin"
	"log"
)

func main() {
	// 1. Load Cấu hình
	cfg := config.LoadConfig()

	// 2. Kết nối & Kiểm tra Database
	db := app.InitDatabase(cfg)

	// 3. Kết nối kho lưu trữ minh chứng
	objectStorage, err := storage.NewMinIOStorage(
		cfg.MinIO.Endpoint,
		cfg.MinIO.AccessKey,
		cfg.MinIO.SecretKey,
		cfg.MinIO.Bucket,
		cfg.MinIO.UseSSL,
	)
	if err != nil {
		log.Fatalf("Không thể cấu hình MinIO: %v", err)
	}
	if err := objectStorage.EnsureBucket(context.Background()); err != nil {
		log.Fatalf("Không thể khởi tạo bucket minh chứng: %v", err)
	}

	// 4. Khởi tạo Gin Framework
	r := gin.Default()
	routes.SetupRoutes(r, db, cfg, objectStorage)
	r.Use(middleware.CORSMiddleware())

	// 5. API Endpoint kiểm tra Trạng thái Server & DB
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

	// 6. Khởi chạy Server
	r.Run(":" + cfg.AppPort)
}
