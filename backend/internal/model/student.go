package model

import "time"

type Student struct {
	StudentID          string     `json:"studentId"`
	ClassCode          string     `json:"classCode"`
	Gender             string     `json:"gender"`
	BirthDay           *time.Time `json:"birthDay,omitempty"`
	LastName           string     `json:"lastName"`
	FirstName          string     `json:"firstName"`
	IsInClass          bool       `json:"isInClass"`
	BirthPlace         string     `json:"birthPlace"`
	ClassRoleID        int        `json:"classRoleId"`
	StudyProgramID     string     `json:"studyProgramId"`
	PermanentResidence string     `json:"permanentResidence"`
	StudentName        string     `json:"studentName"`
	DeletedAt          *time.Time `json:"-"`
}
