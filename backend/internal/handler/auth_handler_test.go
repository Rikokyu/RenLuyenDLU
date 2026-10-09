package handler

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"renluyen-dlu-backend/internal/service"

	"github.com/gin-gonic/gin"
)

type fakeAuthService struct {
	loginResult service.AuthResult
	loginError  error
}

func (f fakeAuthService) Login(context.Context, string, string) (service.AuthResult, error) {
	return f.loginResult, f.loginError
}

func (fakeAuthService) LoginWithGoogle(context.Context, string) (service.AuthResult, error) {
	return service.AuthResult{}, nil
}

func (fakeAuthService) ChangePassword(context.Context, int64, string, string) error {
	return nil
}

func (fakeAuthService) GetProfile(context.Context, int64) (service.Profile, error) {
	return service.Profile{}, nil
}

func (fakeAuthService) ValidateToken(string) (int64, string, error) {
	return 1, "STUDENT", nil
}

func TestLoginReturnsSessionWithoutPassword(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	authHandler := NewAuthHandler(fakeAuthService{
		loginResult: service.AuthResult{
			Token: "session-token",
			User:  service.AuthUser{ID: 1, Name: "Nguyễn Trung Hiệp", Role: "ADMIN"},
		},
	})
	router.POST("/auth/login", authHandler.Login)

	request := httptest.NewRequest(http.MethodPost, "/auth/login", strings.NewReader(
		`{"username":"2312610","password":"DLU@2026"}`,
	))
	request.Header.Set("Content-Type", "application/json")
	response := httptest.NewRecorder()
	router.ServeHTTP(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d: %s", http.StatusOK, response.Code, response.Body.String())
	}
	if strings.Contains(response.Body.String(), "DLU@2026") {
		t.Fatal("login response must not expose the submitted password")
	}
	if !strings.Contains(response.Body.String(), `"token":"session-token"`) {
		t.Fatalf("expected session token in response, got %s", response.Body.String())
	}
}

func TestLoginRejectsInvalidCredentials(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	authHandler := NewAuthHandler(fakeAuthService{loginError: service.ErrInvalidCredentials})
	router.POST("/auth/login", authHandler.Login)

	request := httptest.NewRequest(http.MethodPost, "/auth/login", strings.NewReader(
		`{"username":"2312610","password":"wrong"}`,
	))
	request.Header.Set("Content-Type", "application/json")
	response := httptest.NewRecorder()
	router.ServeHTTP(response, request)

	if response.Code != http.StatusUnauthorized {
		t.Fatalf("expected status %d, got %d", http.StatusUnauthorized, response.Code)
	}
}

func TestLoginReportsUnexpectedServiceErrors(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	authHandler := NewAuthHandler(fakeAuthService{loginError: errors.New("database unavailable")})
	router.POST("/auth/login", authHandler.Login)

	request := httptest.NewRequest(http.MethodPost, "/auth/login", strings.NewReader(
		`{"username":"2312610","password":"DLU@2026"}`,
	))
	request.Header.Set("Content-Type", "application/json")
	response := httptest.NewRecorder()
	router.ServeHTTP(response, request)

	if response.Code != http.StatusInternalServerError {
		t.Fatalf("expected status %d, got %d", http.StatusInternalServerError, response.Code)
	}
}
