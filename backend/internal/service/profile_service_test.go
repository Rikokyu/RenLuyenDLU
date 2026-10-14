package service

import (
	"context"
	"errors"
	"testing"

	"renluyen-dlu-backend/internal/dto"
)

func TestUpdateProfileRejectsInvalidInputBeforeDatabaseAccess(t *testing.T) {
	svc := &authService{}

	_, err := svc.UpdateProfile(context.Background(), 1, dto.ProfileMutation{
		FirstName: "An",
		LastName:  "Nguyễn Văn",
		Gender:    "Nam",
		BirthDay:  "not-a-date",
		Phone:     "0900000000",
	})
	if !errors.Is(err, ErrInvalidProfile) {
		t.Fatalf("expected ErrInvalidProfile, got %v", err)
	}
}
