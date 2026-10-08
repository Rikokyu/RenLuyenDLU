package dto

type StudentProfile struct {
	StudentCode string `json:"studentCode"`
	FirstName   string `json:"firstName"`
	LastName    string `json:"lastName"`
	FullName    string `json:"fullName"`
	Gender      string `json:"gender"`
	BirthDate   string `json:"birthDate"`
	BirthPlace  string `json:"birthPlace"`
	Phone       string `json:"phone"`
	Email       string `json:"email"`
	ClassCode   string `json:"classCode"`
	ClassName   string `json:"className"`
	MajorCode   string `json:"majorCode"`
	MajorName   string `json:"majorName"`
	FacultyCode string `json:"facultyCode"`
	FacultyName string `json:"facultyName"`
}

type LecturerProfile struct {
	LecturerCode string `json:"lecturerCode"`
	FirstName    string `json:"firstName"`
	LastName     string `json:"lastName"`
	FullName     string `json:"fullName"`
	Gender       string `json:"gender"`
	BirthDate    string `json:"birthDate"`
	BirthPlace   string `json:"birthPlace"`
	Phone        string `json:"phone"`
	Email        string `json:"email"`
	FacultyCode  string `json:"facultyCode"`
	FacultyName  string `json:"facultyName"`
}
