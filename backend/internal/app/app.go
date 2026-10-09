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
	if err := migrateAuthentication(db); err != nil {
		log.Fatalf("❌ Không thể cập nhật schema xác thực: %v", err)
	}

	fmt.Println("========================================")
	fmt.Println("✅ KẾT NỐI DATABASE THÀNH CÔNG!")
	fmt.Println("========================================")

	return db
}

func migrateAuthentication(db *gorm.DB) error {
	if err := db.Exec(`CREATE EXTENSION IF NOT EXISTS pgcrypto`).Error; err != nil {
		return err
	}
	if err := db.Exec(`
		ALTER TABLE "User"
			ADD COLUMN IF NOT EXISTS responsiblefaculty TEXT NOT NULL DEFAULT '',
			ADD COLUMN IF NOT EXISTS password_changed BOOLEAN NOT NULL DEFAULT FALSE
	`).Error; err != nil {
		return err
	}
	if err := db.Exec(`
		CREATE TABLE IF NOT EXISTS app_migrations (
			name TEXT PRIMARY KEY,
			applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)
	`).Error; err != nil {
		return err
	}

	return db.Transaction(func(tx *gorm.DB) error {
		result := tx.Exec(`
			INSERT INTO app_migrations (name)
			VALUES ('20261009_authentication_defaults')
			ON CONFLICT (name) DO NOTHING
		`)
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			return nil
		}
		return tx.Exec(`
			UPDATE "User"
			SET password = crypt('DLU@2026', gen_salt('bf', 10)),
			    password_changed = FALSE
			WHERE password_changed = FALSE
		`).Error
	})
}
