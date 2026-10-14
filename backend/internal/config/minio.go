package config

import (
	"log"
	"strconv"
)

type MinIOConfig struct {
	Endpoint  string
	AccessKey string
	SecretKey string
	Bucket    string
	UseSSL    bool
}

func loadMinIOConfig() MinIOConfig {
	useSSL, err := strconv.ParseBool(getEnv("MINIO_USE_SSL", "false"))
	if err != nil {
		log.Fatalf("MINIO_USE_SSL không hợp lệ: %v", err)
	}
	endpointFallback := "localhost:9002"
	if getEnv("APP_ENV", "development") == "production" {
		endpointFallback = "minio:9000"
	}
	return MinIOConfig{
		Endpoint:  getEnv("MINIO_ENDPOINT", endpointFallback),
		AccessKey: getEnv("MINIO_ACCESS_KEY", "minioadmin"),
		SecretKey: getEnv("MINIO_SECRET_KEY", "minioadmin"),
		Bucket:    getEnv("MINIO_BUCKET", "evidence"),
		UseSSL:    useSSL,
	}
}
