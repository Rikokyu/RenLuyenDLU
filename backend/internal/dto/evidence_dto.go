package dto

import (
	"time"

	"renluyen-dlu-backend/internal/model"
)

// EvidenceQueryReq chứa thông tin lọc tìm kiếm từ Frontend
type EvidenceQueryReq struct {
	Search    string     `form:"search"`
	Status    *int       `form:"status"`
	FacultyID *int64     `form:"faculty_id"`
	MajorID   *int64     `form:"major_id"`
	ClassID   *int64     `form:"class_id"`
	FromDate  *time.Time `form:"from_date" time_format:"2006-01-02"`
	ToDate    *time.Time `form:"to_date" time_format:"2006-01-02"`
}

type EvidenceFilterOptions struct {
	Faculties []model.Faculty `json:"faculties"`
	Majors    []model.Major   `json:"majors"`
	Classes   []model.Class   `json:"classes"`
}

// EvidenceStats cấu trúc phản hồi 4 ô thống kê
type EvidenceStats struct {
	Total    int64 `json:"total"`
	Pending  int64 `json:"pending"`
	Approved int64 `json:"approved"`
	Rejected int64 `json:"rejected"`
}

// UpdateStatusReq cấu trúc body cho API đổi trạng thái
type UpdateStatusReq struct {
	EvidenceID int64 `json:"evidence_id" binding:"required,gt=0"`
	Status     int   `json:"status"` // 1: Duyệt, 2: Từ chối
}

type ApproveEvidencesReq struct {
	EvidenceIDs []int64 `json:"evidence_ids" binding:"required,min=1,dive,gt=0"`
}
