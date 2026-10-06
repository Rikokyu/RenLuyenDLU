package dto
type ManagerTrainingScore struct {
	StudentID string `json:"studentId"`
	MSSV      string `json:"mssv"`
	Name      string `json:"name"`
	ClassCode string `json:"classCode"`
	Score     int    `json:"score"`
	SchoolYear string `json:"schoolYear"`
	Semester   int    `json:"semester"`
}