package model

type Role struct {
	ID     int64  `gorm:"primaryKey;column:id" json:"id"`
	Name   string `gorm:"column:name" json:"name"`
	Status int    `gorm:"column:status" json:"status"`
}

func (Role) TableName() string { return "role" }
