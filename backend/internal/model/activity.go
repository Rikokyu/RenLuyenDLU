package model

import "time"

type Activity struct {
	ID           int64     `gorm:"primaryKey;column:id" json:"id"`
	ActivityCode string    `gorm:"column:activity_code" json:"activity_code"`
	Title        string    `gorm:"column:title" json:"title"`
	TimeBegin    time.Time `gorm:"column:timebegin" json:"time_begin"`
	TimeEnd      time.Time `gorm:"column:timeend" json:"time_end"`
	Slot         int       `gorm:"column:slot" json:"slot"`
	Detail       string    `gorm:"column:detail" json:"detail"`
	Score        int       `gorm:"column:score" json:"score"`
	Status       int       `gorm:"column:status" json:"status"`
	IdUser       int64     `gorm:"column:iduser" json:"id_user"`
}

func (Activity) TableName() string {
	return "activity"
}
