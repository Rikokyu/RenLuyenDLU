package config

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strconv"

	"github.com/joho/godotenv"
)

// Config chứa toàn bộ tham số cấu hình của ứng dụng
type Config struct {
	AppPort        string
	AppEnv         string
	DBHost         string
	DBPort         string
	DBUser         string
	DBPass         string
	DBName         string
	DBSSLMode      string
	JWTSecret      string
	JWTExpireHours int
	GoogleClientID string
	MinIO          MinIOConfig
}

// LoadConfig đọc cấu hình từ .env hoặc môi trường Docker/OS
func LoadConfig() *Config {
	envFiles := []string{}
	if _, err := os.Stat(".env"); err == nil {
		envFiles = append(envFiles, ".env")
	}
	if _, err := os.Stat(filepath.Join("..", "docker-compose.yml")); err == nil {
		rootEnv := filepath.Join("..", ".env")
		if _, err := os.Stat(rootEnv); err == nil {
			envFiles = append(envFiles, rootEnv)
		}
	}
	if len(envFiles) == 0 {
		log.Println("Lưu ý: Không tìm thấy file .env, hệ thống sẽ sử dụng biến môi trường từ OS/Docker.")
	} else if err := godotenv.Load(envFiles...); err != nil {
		log.Printf("Không thể đọc cấu hình môi trường: %v", err)
	}

	jwtExpire, _ := strconv.Atoi(getEnv("JWT_EXPIRE_HOURS", "24"))
	jwtSecret := getEnv("JWT_SECRET", "")
	if len(jwtSecret) < 32 {
		log.Fatal("JWT_SECRET phải được cấu hình với ít nhất 32 ký tự.")
	}

	cfg := &Config{
		AppPort:        getEnv("PORT", "8080"),
		AppEnv:         getEnv("APP_ENV", "development"),
		DBHost:         getEnv("DB_HOST", "localhost"),
		DBPort:         getEnv("DB_PORT", "5432"),
		DBUser:         getEnv("DB_USER", "postgres"),
		DBPass:         getEnv("DB_PASSWORD", "postgres"),
		DBName:         getEnv("DB_NAME", "renluyen_dlu"),
		DBSSLMode:      getEnv("DB_SSLMODE", "disable"),
		JWTSecret:      jwtSecret,
		JWTExpireHours: jwtExpire,
		GoogleClientID: getEnv("GOOGLE_CLIENT_ID", ""),
		MinIO:          loadMinIOConfig(),
	}

	return cfg
}

// GetDatabaseURL trả về chuỗi kết nối dạng URL chuẩn của PostgreSQL
func (c *Config) GetDatabaseURL() string {
	return fmt.Sprintf(
		"postgresql://%s:%s@%s:%s/%s?sslmode=%s&TimeZone=Asia/Ho_Chi_Minh",
		c.DBUser, c.DBPass, c.DBHost, c.DBPort, c.DBName, c.DBSSLMode,
	)
}

// getEnv đọc giá trị biến môi trường, nếu trống sẽ lấy giá trị mặc định (fallback)
func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists && value != "" {
		return value
	}
	return fallback
}
