package dto

type ManagerStudent struct {
	ID                 string `json:"id"`
	MSSV               string `json:"mssv"`
	Name               string `json:"name"`
	FirstName          string `json:"firstName"`
	LastName           string `json:"lastName"`
	ClassCode          string `json:"classCode"`
	ClassName          string `json:"className"`
	FacultyName        string `json:"facultyName"`
	StudyProgramID     string `json:"studyProgramId"`
	Gender             string `json:"gender"`
	BirthDay           string `json:"birthDay"`
	BirthPlace         string `json:"birthPlace"`
	Phone              string `json:"phone"`
	Email              string `json:"email"`
	HometownCountry    string `json:"hometownCountry"`
	HometownProvince   string `json:"hometownProvince"`
	HometownCity       string `json:"hometownCity"`
	HometownAddress    string `json:"hometownAddress"`
	IsInClass          bool   `json:"isInClass"`
	ClassRoleID        int    `json:"classRoleId"`
	PermanentResidence string `json:"permanentResidence"`
}

type ManagerStudentQuery struct {
	Search    string `form:"search"`
	ClassCode string `form:"class_code"`
}
