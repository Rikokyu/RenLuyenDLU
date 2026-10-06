package model

import "time"

type User struct {
	ID         int64     `gorm:"primaryKey;column:id" json:"id"`
	FirstName  string    `gorm:"column:firstname" json:"first_name"`
	LastName   string    `gorm:"column:lastname" json:"last_name"`
	Gender     string    `gorm:"column:gender" json:"gender"`
	DOB        time.Time `gorm:"column:dob" json:"dob"`
	BirthPlace string    `gorm:"column:birthplace" json:"birth_place"`
	Phone      string    `gorm:"column:phone" json:"phone"`
	Email      string    `gorm:"column:email" json:"email"`
	Status     int       `gorm:"column:status" json:"status"`
	IdRole     int64     `gorm:"column:idrole" json:"id_role"`
	Role       Role      `gorm:"foreignKey:IdRole;references:ID" json:"role"`
}

func (User) TableName() string { return "User" }
