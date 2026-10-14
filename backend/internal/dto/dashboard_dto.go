package dto

import "time"

type DashboardOverview struct {
	ScopeName             string                `json:"scopeName"`
	TotalStudents         int64                 `json:"totalStudents"`
	ParticipatingStudents int64                 `json:"participatingStudents"`
	RegistrationCount     int64                 `json:"registrationCount"`
	ActivityCount         int64                 `json:"activityCount"`
	CompletedActivities   int64                 `json:"completedActivities"`
	RunningActivities     int64                 `json:"runningActivities"`
	UpcomingActivities    int64                 `json:"upcomingActivities"`
	PendingEvidence       int64                 `json:"pendingEvidence"`
	CompletionRate        int                   `json:"completionRate"`
	Activities            []DashboardActivity   `json:"activities"`
	RecentRegistrations   []DashboardEnrollment `json:"recentRegistrations"`
	RecentEvidence        []DashboardEvidence   `json:"recentEvidence"`
}

type DashboardActivity struct {
	ID              int64     `json:"id"`
	ActivityCode    string    `json:"activityCode"`
	Title           string    `json:"title"`
	TimeBegin       time.Time `json:"timeBegin"`
	TimeEnd         time.Time `json:"timeEnd"`
	Slot            int       `json:"slot"`
	RegisteredCount int64     `json:"registeredCount"`
	Score           int       `json:"score"`
	Status          int       `json:"status"`
}

type DashboardEnrollment struct {
	StudentName string    `json:"studentName"`
	StudentID   string    `json:"studentId"`
	ActivityID  int64     `json:"activityId"`
	Activity    string    `json:"activity"`
	Registered  time.Time `json:"registeredAt"`
}

type DashboardEvidence struct {
	StudentName string    `json:"studentName"`
	StudentID   string    `json:"studentId"`
	ActivityID  int64     `json:"activityId"`
	Activity    string    `json:"activity"`
	Status      int       `json:"status"`
	SubmittedAt time.Time `json:"submittedAt"`
}
