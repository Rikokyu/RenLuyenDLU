package repository

import "testing"

func TestSeededAssistantFacultyCode(t *testing.T) {
	tests := []struct {
		email string
		want  string
	}{
		{email: "hieunt@dlu.edu.vn", want: "CT"},
		{email: "PHATTV@DLU.EDU.VN", want: "KT"},
		{email: "unknown@dlu.edu.vn", want: ""},
	}

	for _, test := range tests {
		if got := seededAssistantFacultyCode(test.email); got != test.want {
			t.Errorf("seededAssistantFacultyCode(%q) = %q, want %q", test.email, got, test.want)
		}
	}
}
