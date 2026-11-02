package model

type ReportPeriod struct {
	FromDate string `json:"fromDate"`
	ToDate   string `json:"toDate"`
}

type ReportMetrics struct {
	TotalStudents           int64    `json:"totalStudents"`
	ParticipatingStudents   int64    `json:"participatingStudents"`
	ParticipationRate       *float64 `json:"participationRate"`
	OrganizedEvents         int64    `json:"organizedEvents"`
	SchoolEvents            int64    `json:"schoolEvents"`
	FacultyEvents           int64    `json:"facultyEvents"`
	UnclassifiedEvents      int64    `json:"unclassifiedEvents"`
	Registrations           int64    `json:"registrations"`
	ConfirmedParticipations int64    `json:"confirmedParticipations"`
	CheckInRate             *float64 `json:"checkInRate"`
	VolunteerHours          float64  `json:"volunteerHours"`
}

type ReportChanges struct {
	ParticipatingStudentsPercent *float64 `json:"participatingStudentsPercent"`
	OrganizedEvents              int64    `json:"organizedEvents"`
	CheckInPercentagePoints      *float64 `json:"checkInPercentagePoints"`
	VolunteerHoursPercent        *float64 `json:"volunteerHoursPercent"`
}

type ReportOverview struct {
	ScopeName       string        `json:"scopeName"`
	Period          ReportPeriod  `json:"period"`
	PreviousPeriod  ReportPeriod  `json:"previousPeriod"`
	Current         ReportMetrics `json:"current"`
	Previous        ReportMetrics `json:"previous"`
	Changes         ReportChanges `json:"changes"`
	AttendanceBasis string        `json:"attendanceBasis"`
	HoursBasis      string        `json:"hoursBasis"`
}
