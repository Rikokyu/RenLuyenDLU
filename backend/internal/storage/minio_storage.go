package storage

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"time"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

type MinIOStorage struct {
	client *minio.Client
	bucket string
}

func NewMinIOStorage(endpoint, accessKey, secretKey, bucket string, useSSL bool) (*MinIOStorage, error) {
	if endpoint == "" || accessKey == "" || secretKey == "" || bucket == "" {
		return nil, errors.New("cấu hình MinIO chưa đầy đủ")
	}
	client, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKey, secretKey, ""),
		Secure: useSSL,
	})
	if err != nil {
		return nil, fmt.Errorf("không thể khởi tạo MinIO client: %w", err)
	}
	return &MinIOStorage{client: client, bucket: bucket}, nil
}

func (s *MinIOStorage) EnsureBucket(ctx context.Context) error {
	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()
	var lastErr error
	for attempt := 0; attempt < 15; attempt++ {
		exists, err := s.client.BucketExists(ctx, s.bucket)
		if err == nil && exists {
			return nil
		}
		if err == nil {
			err = s.client.MakeBucket(ctx, s.bucket, minio.MakeBucketOptions{Region: "us-east-1"})
			if err == nil {
				return nil
			}
			// Another backend instance may create the bucket concurrently.
			exists, checkErr := s.client.BucketExists(ctx, s.bucket)
			if checkErr == nil && exists {
				return nil
			}
			if checkErr != nil {
				err = checkErr
			}
		}
		lastErr = err
		select {
		case <-ctx.Done():
			return fmt.Errorf("không thể kết nối MinIO: %w", ctx.Err())
		case <-time.After(time.Second):
		}
	}
	return fmt.Errorf("không thể khởi tạo bucket MinIO %q: %w", s.bucket, lastErr)
}

func (s *MinIOStorage) Put(ctx context.Context, objectKey, contentType string, content []byte) error {
	_, err := s.client.PutObject(ctx, s.bucket, objectKey, bytes.NewReader(content), int64(len(content)), minio.PutObjectOptions{
		ContentType: contentType,
	})
	if err != nil {
		return fmt.Errorf("không thể tải object %q lên MinIO: %w", objectKey, err)
	}
	return nil
}

func (s *MinIOStorage) Get(ctx context.Context, objectKey string) (io.ReadCloser, error) {
	object, err := s.client.GetObject(ctx, s.bucket, objectKey, minio.GetObjectOptions{})
	if err != nil {
		return nil, fmt.Errorf("không thể mở object %q từ MinIO: %w", objectKey, err)
	}
	if _, err := object.Stat(); err != nil {
		_ = object.Close()
		return nil, fmt.Errorf("không tìm thấy object %q trong MinIO: %w", objectKey, err)
	}
	return object, nil
}

func (s *MinIOStorage) Delete(ctx context.Context, objectKey string) error {
	if err := s.client.RemoveObject(ctx, s.bucket, objectKey, minio.RemoveObjectOptions{}); err != nil {
		return fmt.Errorf("không thể xóa object %q khỏi MinIO: %w", objectKey, err)
	}
	return nil
}
