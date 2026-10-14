package storage

import (
	"bytes"
	"context"
	"os"
	"testing"
	"time"

	"github.com/minio/minio-go/v7"
)

func TestActivityImageMinIORoundTrip(t *testing.T) {
	endpoint := os.Getenv("MINIO_TEST_ENDPOINT")
	if endpoint == "" {
		t.Skip("set MINIO_TEST_ENDPOINT to run the MinIO integration test")
	}
	accessKey := os.Getenv("MINIO_TEST_ACCESS_KEY")
	secretKey := os.Getenv("MINIO_TEST_SECRET_KEY")
	bucket := os.Getenv("MINIO_TEST_BUCKET")
	if accessKey == "" || secretKey == "" || bucket == "" {
		t.Fatal("MINIO_TEST_ACCESS_KEY, MINIO_TEST_SECRET_KEY, and MINIO_TEST_BUCKET are required")
	}

	imageStore, err := NewActivityImages(endpoint, accessKey, secretKey, bucket)
	if err != nil {
		t.Fatalf("create activity image store: %v", err)
	}
	store := imageStore.(*minioActivityImages)
	activityID := time.Now().UnixNano()
	data := []byte("minio-round-trip-test")

	if err := store.Save(context.Background(), activityID, "image/png", data); err != nil {
		t.Fatalf("save activity image: %v", err)
	}
	t.Cleanup(func() {
		if err := store.client.RemoveObject(context.Background(), bucket, activityImageKey(activityID), minio.RemoveObjectOptions{}); err != nil {
			t.Errorf("remove test image: %v", err)
		}
	})

	got, contentType, err := store.Get(context.Background(), activityID)
	if err != nil {
		t.Fatalf("get activity image: %v", err)
	}
	if !bytes.Equal(got, data) || contentType != "image/png" {
		t.Fatalf("unexpected round trip: content type %q, data %q", contentType, got)
	}
}
