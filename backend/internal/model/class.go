package model

type Class struct {
	ID        int64  `gorm:"primaryKey;column:id" json:"id"`
	ClassCode string `gorm:"column:class_code" json:"class_code"`
	Name      string `gorm:"column:name" json:"name"`
	Status    int    `gorm:"column:status" json:"status"`
	IdMajor   int64  `gorm:"column:idmajor" json:"id_major"`

	Major      Major       `gorm:"foreignKey:IdMajor;references:ID" json:"major"`
	ClassYears []ClassYear `gorm:"foreignKey:IdClass;references:ID" json:"class_years"`
}

func (Class) TableName() string { return "class" }
