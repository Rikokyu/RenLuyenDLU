package app

import (
	"fmt"
	"log"

	"renluyen-dlu-backend/internal/config"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func InitDatabase(cfg *config.Config) *gorm.DB {
	dbURL := cfg.GetDatabaseURL()

	db, err := gorm.Open(postgres.Open(dbURL), &gorm.Config{})
	if err != nil {
		log.Fatalf("❌ Kết nối Database thất bại: %v", err)
	}

	sqlDB, err := db.DB()
	if err != nil || sqlDB.Ping() != nil {
		log.Fatalf("❌ Không thể PING tới Database: %v", err)
	}

	fmt.Println("========================================")
	fmt.Println("✅ KẾT NỐI DATABASE THÀNH CÔNG!")
	fmt.Println("========================================")

	return db
}
