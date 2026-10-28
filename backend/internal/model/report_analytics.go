package model

type ReportSemester struct {
	ID       int64  `json:"id"`
	Year     string `json:"year"`
	Semester int    `json:"semester"`
}

type ReportScoreBand struct {
	Key        string   `json:"key"`
	Label      string   `json:"label"`
	Count      int64    `json:"count"`
	Percentage *float64 `json:"percentage"`
}

type ReportScores struct {
	Semester         *ReportSemester   `json:"semester"`
	TotalStudents    int64             `json:"totalStudents"`
	GradedStudents   int64             `json:"gradedStudents"`
	UngradedStudents int64             `json:"ungradedStudents"`
	InvalidScores    int64             `json:"invalidScores"`
	Bands            []ReportScoreBand `json:"bands"`
}

type ReportEventConversion struct {
	ID          int64    `json:"id"`
	Code        string   `json:"code"`
	Title       string   `json:"title"`
	Registered  int64    `json:"registered"`
	Attended    int64    `json:"attended"`
	Pending     int64    `json:"pending"`
	NoShow      int64    `json:"noShow"`
	CheckInRate *float64 `json:"checkInRate"`
	NoShowRate  *float64 `json:"noShowRate"`
}

type ReportTopStudent struct {
	ID          int64   `json:"id"`
	StudentCode string  `json:"studentCode"`
	Name        string  `json:"name"`
	Faculty     string  `json:"faculty"`
	ClassCode   string  `json:"classCode"`
	Events      int64   `json:"events"`
	Hours       float64 `json:"hours"`
	Rank        int     `json:"rank"`
}

type ReportAnalyticsQuery struct {
	Period       ReportPeriod
	SchoolYearID int64
	Page         int
	PageSize     int
	TopLimit     int
	Sort         string
}

type ReportAnalytics struct {
	ScopeName       string                  `json:"scopeName"`
	Period          ReportPeriod            `json:"period"`
	Semesters       []ReportSemester        `json:"semesters"`
	Scores          ReportScores            `json:"scores"`
	Events          []ReportEventConversion `json:"events"`
	EventTotal      int64                   `json:"eventTotal"`
	Page            int                     `json:"page"`
	PageSize        int                     `json:"pageSize"`
	TopStudents     []ReportTopStudent      `json:"topStudents"`
	AttendanceBasis string                  `json:"attendanceBasis"`
}
