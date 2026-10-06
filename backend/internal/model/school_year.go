package model

type SchoolYear struct {
	ID       int64  `gorm:"primaryKey;column:id" json:"id"`
	Year     string `gorm:"column:year" json:"year"`
	Semester int    `gorm:"column:semester" json:"semester"`
}

func (SchoolYear) TableName() string { return "school_year" }
