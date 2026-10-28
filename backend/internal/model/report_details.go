package model

import "time"

type ReportDetailQuery struct {
	Export    bool
	Search    string
	FacultyID int64
	MajorID   int64
	ClassID   int64
	Page      int
	PageSize  int
}
type ReportDetailRow struct {
	ID            int64      `json:"id"`
	StudentID     string     `json:"studentId"`
	StudentName   string     `json:"studentName"`
	ClassName     string     `json:"className"`
	Major         string     `json:"major"`
	Faculty       string     `json:"faculty"`
	EventName     string     `json:"eventName"`
	SubmittedAt   *time.Time `json:"submittedAt"`
	ActivityScore *int       `json:"activityScore"`
	EvidenceID    *int64     `json:"evidenceId"`
	Status        *int       `json:"status"`
}
type ReportClassOption struct {
	ID          int64  `json:"id"`
	Name        string `json:"name"`
	MajorID     int64  `json:"majorId"`
	MajorName   string `json:"majorName"`
	FacultyID   int64  `json:"facultyId"`
	FacultyName string `json:"facultyName"`
}
type ReportDetails struct {
	ScopeName string              `json:"scopeName"`
	Items     []ReportDetailRow   `json:"items"`
	Classes   []ReportClassOption `json:"classes"`
	Total     int64               `json:"total"`
	Page      int                 `json:"page"`
	PageSize  int                 `json:"pageSize"`
}
