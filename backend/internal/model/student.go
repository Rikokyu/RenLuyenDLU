package model

import (
	"encoding/json"
	"strings"
)

type Student struct {
	ID          int64  `gorm:"primaryKey;column:id" json:"id"`
	StudentCode string `gorm:"column:student_code" json:"student_code"`
	IdClass     int64  `gorm:"column:idclass" json:"id_class"`
	IdUser      int64  `gorm:"column:iduser" json:"id_user"`

	Class Class `gorm:"foreignKey:IdClass;references:ID" json:"class"`
	User  User  `gorm:"foreignKey:IdUser;references:ID" json:"user"`
}

func (Student) TableName() string {
	return "student"
}

// Hàm hỗ trợ lấy tên đầy đủ
func (s *Student) GetFullName() string {
	return strings.TrimSpace(s.User.FirstName + " " + s.User.LastName)
}

// MarshalJSON includes the computed name in API responses; methods alone are
// not serialized by encoding/json.
func (s Student) MarshalJSON() ([]byte, error) {
	type studentJSON Student
	return json.Marshal(struct {
		studentJSON
		FullName string `json:"full_name"`
	}{
		studentJSON: studentJSON(s),
		FullName:    s.GetFullName(),
	})
}
