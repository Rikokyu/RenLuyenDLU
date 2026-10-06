package model

type Faculty struct {
	ID          int64  `gorm:"primaryKey;column:id" json:"id"`
	FacultyCode string `gorm:"column:faculty_code" json:"faculty_code"`
	Name        string `gorm:"column:name" json:"name"`
	Status      int    `gorm:"column:status" json:"status"`
}

func (Faculty) TableName() string { return "faculty" }
