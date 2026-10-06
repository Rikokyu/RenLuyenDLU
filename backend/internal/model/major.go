package model

type Major struct {
	ID        int64  `gorm:"primaryKey;column:id" json:"id"`
	MajorCode string `gorm:"column:major_code" json:"major_code"`
	Name      string `gorm:"column:name" json:"name"`
	Status    int    `gorm:"column:status" json:"status"`
	IdFaculty int64  `gorm:"column:idfaculty" json:"id_faculty"`

	Faculty Faculty `gorm:"foreignKey:IdFaculty;references:ID" json:"faculty"`
}

func (Major) TableName() string { return "major" }
