package storage

import (
	"context"
	"io"
)

type Storage interface {
	Put(ctx context.Context, objectKey, contentType string, content []byte) error
	Get(ctx context.Context, objectKey string) (io.ReadCloser, error)
	Delete(ctx context.Context, objectKey string) error
}
