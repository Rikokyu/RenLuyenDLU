package storage

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"strings"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

var ErrImageNotFound = errors.New("activity image not found")

type ActivityImages interface {
	Save(ctx context.Context, activityID int64, contentType string, data []byte) error
	Get(ctx context.Context, activityID int64) ([]byte, string, error)
}

type minioActivityImages struct {
	client *minio.Client
	bucket string
}

func NewActivityImages(endpoint, accessKey, secretKey, bucket string) (ActivityImages, error) {
	if strings.TrimSpace(endpoint) == "" || strings.TrimSpace(accessKey) == "" ||
		strings.TrimSpace(secretKey) == "" || strings.TrimSpace(bucket) == "" {
		return nil, errors.New("MinIO endpoint, credentials and bucket are required")
	}
	client, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKey, secretKey, ""),
		Secure: false,
	})
	if err != nil {
		return nil, fmt.Errorf("create MinIO client: %w", err)
	}
	return &minioActivityImages{client: client, bucket: bucket}, nil
}

func (s *minioActivityImages) Save(
	ctx context.Context,
	activityID int64,
	contentType string,
	data []byte,
) error {
	exists, err := s.client.BucketExists(ctx, s.bucket)
	if err != nil {
		return fmt.Errorf("check MinIO bucket: %w", err)
	}
	if !exists {
		if err := s.client.MakeBucket(ctx, s.bucket, minio.MakeBucketOptions{}); err != nil {
			response := minio.ToErrorResponse(err)
			if response.Code != "BucketAlreadyOwnedByYou" && response.Code != "BucketAlreadyExists" {
				return fmt.Errorf("create MinIO bucket: %w", err)
			}
		}
	}
	_, err = s.client.PutObject(ctx, s.bucket, activityImageKey(activityID), bytes.NewReader(data), int64(len(data)),
		minio.PutObjectOptions{ContentType: contentType})
	if err != nil {
		return fmt.Errorf("upload activity image: %w", err)
	}
	return nil
}

func (s *minioActivityImages) Get(ctx context.Context, activityID int64) ([]byte, string, error) {
	key := activityImageKey(activityID)
	info, err := s.client.StatObject(ctx, s.bucket, key, minio.StatObjectOptions{})
	if err != nil {
		response := minio.ToErrorResponse(err)
		if response.Code == "NoSuchKey" || response.Code == "NoSuchBucket" {
			return nil, "", ErrImageNotFound
		}
		return nil, "", fmt.Errorf("inspect activity image: %w", err)
	}
	object, err := s.client.GetObject(ctx, s.bucket, key, minio.GetObjectOptions{})
	if err != nil {
		return nil, "", fmt.Errorf("read activity image: %w", err)
	}
	defer object.Close()
	data, err := io.ReadAll(io.LimitReader(object, 5*1024*1024+1))
	if err != nil {
		return nil, "", fmt.Errorf("download activity image: %w", err)
	}
	if len(data) > 5*1024*1024 {
		return nil, "", errors.New("stored activity image exceeds 5 MB")
	}
	return data, info.ContentType, nil
}

func activityImageKey(activityID int64) string {
	return fmt.Sprintf("activities/%d/cover", activityID)
}
