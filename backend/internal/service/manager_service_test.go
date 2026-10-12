package service

import (
	"context"
	"testing"

	"renluyen-dlu-backend/internal/dto"
)

func TestManagerFieldValidation(t *testing.T) {
	tests := []struct {
		name  string
		email string
		phone string
		valid bool
	}{
		{name: "DLU email and ten digits", email: "student@dlu.edu.vn", phone: "0901234567", valid: true},
		{name: "wrong email domain", email: "student@example.com", phone: "0901234567"},
		{name: "phone contains letters", email: "student@dlu.edu.vn", phone: "09012abc67"},
		{name: "phone has wrong length", email: "student@dlu.edu.vn", phone: "090123456"},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			isValid := validUniversityEmail(test.email) && managerPhonePattern.MatchString(test.phone)
			if isValid != test.valid {
				t.Fatalf("validation returned %t, want %t", isValid, test.valid)
			}
		})
	}
}

func TestStudentCodeMustContainSevenDigits(t *testing.T) {
	for _, test := range []struct {
		code  string
		valid bool
	}{
		{code: "2312660", valid: true},
		{code: "231266", valid: false},
		{code: "23126A0", valid: false},
	} {
		if got := studentIDPattern.MatchString(test.code); got != test.valid {
			t.Errorf("student code %q validation=%t, want %t", test.code, got, test.valid)
		}
	}
}

func TestSaveStudentRejectsInvalidInputBeforeDatabaseAccess(t *testing.T) {
	manager := &managerService{}
	err := manager.SaveStudent(context.Background(), "", dto.ManagerStudentMutation{
		StudentID:   "12A4567",
		Email:       "student@example.com",
		Phone:       "0901234567",
		ClassCode:   "CSK50A",
		BirthDay:    "2005-01-15",
		StudentName: "Nguyễn Văn An",
	})
	if err == nil {
		t.Fatal("SaveStudent accepted an invalid student code")
	}
}

func TestSplitStudentName(t *testing.T) {
	firstName, lastName := splitStudentName("Nguyễn Văn An")
	if firstName != "Nguyễn Văn" || lastName != "An" {
		t.Fatalf("unexpected name split: firstName=%q lastName=%q", firstName, lastName)
	}
}
