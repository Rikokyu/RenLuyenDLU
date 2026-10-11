package storage

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestMinIOStorageObjectLifecycle(t *testing.T) {
	const content = "image bytes"
	var uploaded, deleted bool
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Query().Has("location") {
			fmt.Fprint(w, `<LocationConstraint xmlns="http://s3.amazonaws.com/doc/2006-03-01/">us-east-1</LocationConstraint>`)
			return
		}
		if r.URL.Path == "/evidence/" || r.URL.Path == "/evidence" {
			w.WriteHeader(http.StatusOK)
			return
		}
		if r.URL.Path != "/evidence/student/proof.png" {
			t.Errorf("unexpected object path %q", r.URL.Path)
			w.WriteHeader(http.StatusNotFound)
			return
		}
		switch r.Method {
		case http.MethodPut:
			uploaded = true
			if r.Header.Get("Content-Type") != "image/png" {
				t.Errorf("unexpected content type %q", r.Header.Get("Content-Type"))
			}
			io.Copy(io.Discard, r.Body)
			w.Header().Set("ETag", `"test-etag"`)
		case http.MethodHead, http.MethodGet:
			w.Header().Set("Content-Length", fmt.Sprint(len(content)))
			w.Header().Set("Content-Type", "image/png")
			w.Header().Set("Last-Modified", "Sun, 11 Oct 2026 00:00:00 GMT")
			w.Header().Set("ETag", `"test-etag"`)
			if r.Method == http.MethodGet {
				fmt.Fprint(w, content)
			}
		case http.MethodDelete:
			deleted = true
			w.WriteHeader(http.StatusNoContent)
		default:
			t.Errorf("unexpected method %s", r.Method)
			w.WriteHeader(http.StatusMethodNotAllowed)
		}
	}))
	defer server.Close()
	s, err := NewMinIOStorage(strings.TrimPrefix(server.URL, "http://"), "test-access", "test-secret", "evidence", false)
	if err != nil {
		t.Fatal(err)
	}
	ctx := context.Background()
	if err := s.EnsureBucket(ctx); err != nil {
		t.Fatal(err)
	}
	if err := s.Put(ctx, "student/proof.png", "image/png", []byte(content)); err != nil {
		t.Fatal(err)
	}
	reader, err := s.Get(ctx, "student/proof.png")
	if err != nil {
		t.Fatal(err)
	}
	data, err := io.ReadAll(reader)
	reader.Close()
	if err != nil || string(data) != content {
		t.Fatalf("read %q: %v", data, err)
	}
	if err := s.Delete(ctx, "student/proof.png"); err != nil {
		t.Fatal(err)
	}
	if !uploaded || !deleted {
		t.Fatalf("uploaded=%v deleted=%v", uploaded, deleted)
	}
}
