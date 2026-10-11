package service

import (
	"path"
	"strings"
	"testing"
)

func TestEvidenceObjectKeyIsStableAndSafe(t *testing.T) {
	key := evidenceObjectKey(27, "../../student/proof", "image/jpeg")
	if !strings.HasPrefix(key, "evidence/27/") {
		t.Fatalf("object key escaped evidence directory: %q", key)
	}
	if strings.Contains(key, "..") || path.IsAbs(key) {
		t.Fatalf("object key is not safe: %q", key)
	}
	if !strings.HasSuffix(key, ".jpe") && !strings.HasSuffix(key, ".jpeg") && !strings.HasSuffix(key, ".jpg") {
		t.Fatalf("unexpected JPEG extension: %q", key)
	}
	if got := evidenceObjectKey(27, "../../student/proof", "image/jpeg"); got != key {
		t.Fatalf("object key must be stable: got %q, want %q", got, key)
	}
}
