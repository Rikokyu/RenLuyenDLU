package model

type TrainingScore struct {
	Order           int    `json:"order"`
	StudentID       string `json:"studentId"`
	ClassCode       string `json:"classCode"`
	FirstName       string `json:"firstName"`
	LastName        string `json:"lastName"`
	BirthDay        string `json:"birthDay"`
	LastScore       int    `json:"lastScore"`
	ClassScore      int    `json:"classScore"`
	StudentScore    int    `json:"studentScore"`
	DepartmentScore int    `json:"departmentScore"`
	StatusID        int    `json:"statusId"`
	UpdateDay       string `json:"updateDay"`
	UpdateStaff     string `json:"updateStaff"`
}
