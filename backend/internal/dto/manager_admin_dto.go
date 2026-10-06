package dto

type ManagerAccount struct {
	ID        int64  `json:"id"`
	Name      string `json:"name"`
	Username  string `json:"username"`
	Email     string `json:"email"`
	Role      string `json:"role"`
	RoleCode  string `json:"roleCode"`
	Unit      string `json:"unit"`
	ClassCode string `json:"classCode"`
	ClassName string `json:"className"`
	StudentID string `json:"studentId"`
	Status    string `json:"status"`
	Active    bool   `json:"active"`
	LastLogin string `json:"lastLogin"`
}

type ManagerAccountMutation struct {
	Name      string `json:"name"`
	Username  string `json:"username"`
	Email     string `json:"email"`
	Password  string `json:"password"`
	RoleCode  string `json:"roleCode"`
	Unit      string `json:"unit"`
	ClassCode string `json:"classCode"`
	Active    bool   `json:"active"`
}

type ManagerClass struct {
	Code         string `json:"code"`
	Faculty      string `json:"faculty"`
	AcademicYear string `json:"academicYear"`
	StudentCount int64  `json:"studentCount"`
}

type ManagerClassMutation struct {
	Code         string `json:"code"`
	Faculty      string `json:"faculty"`
	AcademicYear string `json:"academicYear"`
}

type ManagerStudentMutation struct {
	StudentID          string `json:"studentId"`
	Email              string `json:"email"`
	ClassCode          string `json:"classCode"`
	Faculty            string `json:"faculty"`
	Gender             string `json:"gender"`
	BirthDay           string `json:"birthDay"`
	FirstName          string `json:"firstName"`
	LastName           string `json:"lastName"`
	StudentName        string `json:"studentName"`
	IsInClass          bool   `json:"isInClass"`
	BirthPlace         string `json:"birthPlace"`
	Phone              string `json:"phone"`
	ClassRoleID        int    `json:"classRoleId"`
	StudyProgramID     string `json:"studyProgramId"`
	PermanentResidence string `json:"permanentResidence"`
	HometownCountry    string `json:"hometownCountry"`
	HometownProvince   string `json:"hometownProvince"`
	HometownCity       string `json:"hometownCity"`
	HometownAddress    string `json:"hometownAddress"`
}

type ManagerRole struct {
	Code string `json:"code"`
	Name string `json:"name"`
}
