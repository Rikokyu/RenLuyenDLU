package dto

import "time"

type ActivityQuery struct {
	Search   string `form:"search"`
	Status   *int   `form:"status"`
	FromDate string `form:"from_date"`
	ToDate   string `form:"to_date"`
}

type ActivityMutation struct {
	ActivityCode    string    `json:"activityCode"`
	Title           string    `json:"title" binding:"required"`
	TimeBegin       time.Time `json:"timeBegin" binding:"required"`
	TimeEnd         time.Time `json:"timeEnd" binding:"required"`
	Slot            int       `json:"slot" binding:"required,gt=0"`
	Detail          string    `json:"detail"`
	Score           int       `json:"score" binding:"gte=0"`
	Location        string    `json:"location"`
	UserID          int64     `json:"-"`
	AddressDetailID *int64    `json:"addressDetailId"`
}

type ActivityRegistrationMutation struct {
	StudentCode string `json:"studentCode" binding:"required"`
}

type ActivityListItem struct {
	ID              int64     `json:"id"`
	ActivityCode    string    `json:"activityCode"`
	Title           string    `json:"title"`
	Organizer       string    `json:"organizer"`
	TimeBegin       time.Time `json:"timeBegin"`
	TimeEnd         time.Time `json:"timeEnd"`
	Slot            int       `json:"slot"`
	RegisteredCount int64     `json:"registeredCount"`
	Score           int       `json:"score"`
	Status          int       `json:"status"`
	Detail          string    `json:"detail"`
	Location        string    `json:"location"`
	UserID          int64     `json:"userId"`
}

type ActivityRegistrationResult struct {
	RegistrationID int64     `json:"registrationId"`
	ActivityID     int64     `json:"activityId"`
	StudentCode    string    `json:"studentCode"`
	RegisteredAt   time.Time `json:"registeredAt"`
	Status         int       `json:"status"`
}
