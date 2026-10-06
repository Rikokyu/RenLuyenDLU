package model

type EvidenceStatus int

const (
	EvidenceStatusPending  EvidenceStatus = 0
	EvidenceStatusApproved EvidenceStatus = 1
	EvidenceStatusRejected EvidenceStatus = 2
)

// Evidence follows the database key and relationship: each evidence row
// belongs to an Activity_Registration row through IdAcRegis.
type Evidence struct {
	ID        int64  `gorm:"primaryKey;column:id" json:"id"`
	Data      string `gorm:"column:data" json:"data"`
	Status    int    `gorm:"column:status" json:"status"`
	IdAcRegis int64  `gorm:"column:idacregis" json:"id_ac_regis"`

	Registration ActivityRegistration `gorm:"foreignKey:IdAcRegis;references:ID" json:"registration"`
}

func (Evidence) TableName() string { return "evidence" }
