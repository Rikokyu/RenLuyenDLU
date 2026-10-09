package service

import (
	"encoding/base64"
	"encoding/json"
	"testing"
	"time"
)

func TestAuthTokenValidationRejectsTamperingAndExpiry(t *testing.T) {
	auth := &authService{
		jwtSecret:      []byte("test-secret-with-more-than-thirty-two-characters"),
		jwtExpireHours: 1,
	}
	token, err := auth.issueToken(42, "STUDENT")
	if err != nil {
		t.Fatalf("issueToken returned an error: %v", err)
	}
	userID, role, err := auth.ValidateToken(token)
	if err != nil {
		t.Fatalf("ValidateToken rejected a valid token: %v", err)
	}
	if userID != 42 || role != "STUDENT" {
		t.Fatalf("unexpected token claims: userID=%d role=%q", userID, role)
	}

	replacement := byte('A')
	if token[0] == replacement {
		replacement = 'B'
	}
	tampered := string(replacement) + token[1:]
	if _, _, err := auth.ValidateToken(tampered); err == nil {
		t.Fatal("ValidateToken accepted a tampered token")
	}

	expiredClaims, err := json.Marshal(tokenClaims{
		UserID: 42,
		Role:   "STUDENT",
		Expiry: time.Now().Add(-time.Minute).Unix(),
	})
	if err != nil {
		t.Fatalf("could not create expired claims: %v", err)
	}
	payload := base64.RawURLEncoding.EncodeToString(expiredClaims)
	expiredToken := payload + "." + auth.sign(payload)
	if _, _, err := auth.ValidateToken(expiredToken); err == nil {
		t.Fatal("ValidateToken accepted an expired token")
	}
}

func TestPermissionsAreRoleSpecific(t *testing.T) {
	tests := []struct {
		role     string
		contains string
		excludes string
	}{
		{role: "ADMIN", contains: "*"},
		{role: "STUDENT_AFFAIRS_ASSISTANT", contains: "MANAGER", excludes: "EVIDENCE_SELF"},
		{role: "HOMEROOM_TEACHER", contains: "REPORT_VIEW", excludes: "MANAGER"},
		{role: "CLASS_OFFICER", contains: "REPORT_VIEW", excludes: "MANAGER"},
		{role: "STUDENT", contains: "EVIDENCE_SELF", excludes: "REPORT_VIEW"},
	}

	for _, test := range tests {
		t.Run(test.role, func(t *testing.T) {
			permissions := permissionsForRole(test.role)
			found := false
			for _, permission := range permissions {
				if permission == test.contains {
					found = true
				}
				if test.excludes != "" && permission == test.excludes {
					t.Errorf("role %s must not have permission %s", test.role, test.excludes)
				}
			}
			if !found {
				t.Errorf("role %s is missing permission %s", test.role, test.contains)
			}
		})
	}
}
