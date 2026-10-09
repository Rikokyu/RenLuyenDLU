package routes

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestSwaggerDocumentIsAvailableAndContainsAuthEndpoints(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	MapSwaggerRoutes(router)

	response := httptest.NewRecorder()
	router.ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/swagger/openapi.json", nil))
	if response.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, response.Code)
	}

	var document struct {
		Paths map[string]json.RawMessage `json:"paths"`
	}
	if err := json.Unmarshal(response.Body.Bytes(), &document); err != nil {
		t.Fatalf("Swagger document is not valid JSON: %v", err)
	}
	for _, path := range []string{
		"/auth/login",
		"/auth/google",
		"/auth/me",
		"/auth/password",
		"/manager/students",
		"/manager/students/{id}",
		"/manager/classes",
		"/manager/classes/{code}",
		"/manager/accounts",
		"/manager/accounts/{id}",
		"/manager/accounts/{id}/reset-password",
		"/manager/roles",
		"/evidences",
		"/evidences/stats",
		"/evidences/filters",
		"/evidences/detail",
		"/evidences/status",
		"/evidences/approve",
	} {
		if _, ok := document.Paths[path]; !ok {
			t.Errorf("Swagger document is missing %s", path)
		}
	}

	response = httptest.NewRecorder()
	router.ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/swagger", nil))
	if response.Code != http.StatusOK || response.Header().Get("Content-Type") != "text/html; charset=utf-8" {
		t.Fatalf("expected Swagger UI HTML, got status=%d content-type=%q", response.Code, response.Header().Get("Content-Type"))
	}
}
