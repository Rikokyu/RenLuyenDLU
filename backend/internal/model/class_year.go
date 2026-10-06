package model

type ClassYear struct {
	IdClass int64      `gorm:"primaryKey;column:idclass" json:"id_class"`
	IdYear  int64      `gorm:"primaryKey;column:idyear" json:"id_year"`
	Status  int        `gorm:"column:status" json:"status"`
	Year    SchoolYear `gorm:"foreignKey:IdYear;references:ID" json:"school_year"`
}

func (ClassYear) TableName() string { return "class_year" }
