package model

import "time"

type ActivityRegistration struct {
	ID           int64     `gorm:"primaryKey;column:id" json:"id"`
	RegisteredAt time.Time `gorm:"column:registeredat" json:"registered_at"`
	Status       int       `gorm:"column:status" json:"status"`
	IdStudent    int64     `gorm:"column:idstudent" json:"id_student"`
	IdActivity   int64     `gorm:"column:idactivity" json:"id_activity"`

	Student  Student  `gorm:"foreignKey:IdStudent;references:ID" json:"student"`
	Activity Activity `gorm:"foreignKey:IdActivity;references:ID" json:"activity"`
}

func (ActivityRegistration) TableName() string { return "activity_registration" }
