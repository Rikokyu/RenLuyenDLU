package service

import (
	"context"
	"fmt"

	"renluyen-dlu-backend/internal/dto"
	"renluyen-dlu-backend/internal/model"
	"renluyen-dlu-backend/internal/repository"
)

type EvidenceService interface {
	GetEvidences(ctx context.Context, req dto.EvidenceQueryReq) ([]model.Evidence, error)
	GetEvidenceFilterOptions(ctx context.Context) (*dto.EvidenceFilterOptions, error)
	GetEvidenceStats(ctx context.Context) (*dto.EvidenceStats, error)
	GetEvidenceDetail(ctx context.Context, evidenceID int64) (*model.Evidence, error)
	UpdateEvidenceStatus(ctx context.Context, evidenceID int64, status int) error
	ApproveEvidenceList(ctx context.Context, evidenceIDs []int64) (int64, error)
}

type evidenceService struct {
	repo repository.EvidenceRepository
}

func NewEvidenceService(repo repository.EvidenceRepository) EvidenceService {
	return &evidenceService{repo: repo}
}

// 1. Lấy danh sách minh chứng
func (s *evidenceService) GetEvidences(ctx context.Context, req dto.EvidenceQueryReq) ([]model.Evidence, error) {
	// Bóc tách các tham số từ DTO để truyền vào Repository (Trả về 2 giá trị: []model.Evidence, error)
	return s.repo.GetEvidences(ctx, req.Search, req.Status, req.FacultyID, req.MajorID, req.ClassID, req.FromDate, req.ToDate)
}

func (s *evidenceService) GetEvidenceFilterOptions(ctx context.Context) (*dto.EvidenceFilterOptions, error) {
	faculties, majors, classes, err := s.repo.GetEvidenceFilterOptions(ctx)
	if err != nil {
		return nil, err
	}
	return &dto.EvidenceFilterOptions{Faculties: faculties, Majors: majors, Classes: classes}, nil
}

// 2. Thống kê 4 ô
func (s *evidenceService) GetEvidenceStats(ctx context.Context) (*dto.EvidenceStats, error) {
	statsMap, err := s.repo.GetEvidenceStats(ctx)
	if err != nil {
		return nil, err
	}

	// Chuyển đổi từ map[string]int64 sang *dto.EvidenceStats
	return &dto.EvidenceStats{
		Total:    statsMap["total"],
		Pending:  statsMap["pending"],
		Approved: statsMap["approved"],
		Rejected: statsMap["rejected"],
	}, nil
}

// 3. Xem chi tiết minh chứng
func (s *evidenceService) GetEvidenceDetail(ctx context.Context, evidenceID int64) (*model.Evidence, error) {
	return s.repo.GetEvidenceDetail(ctx, evidenceID)
}

// 4. Cập nhật trạng thái duyệt/từ chối
func (s *evidenceService) UpdateEvidenceStatus(ctx context.Context, evidenceID int64, status int) error {
	// Kiểm tra sự tồn tại của minh chứng trước khi cập nhật
	if status < 0 || status > 2 {
		return fmt.Errorf("trạng thái minh chứng phải là 0, 1 hoặc 2")
	}
	_, err := s.repo.GetEvidenceDetail(ctx, evidenceID)
	if err != nil {
		return err
	}

	return s.repo.UpdateEvidenceStatus(ctx, evidenceID, status)
}

func (s *evidenceService) ApproveEvidenceList(ctx context.Context, evidenceIDs []int64) (int64, error) {
	if len(evidenceIDs) == 0 {
		return 0, fmt.Errorf("chưa có minh chứng nào trong danh sách để duyệt")
	}
	seen := make(map[int64]struct{}, len(evidenceIDs))
	uniqueIDs := make([]int64, 0, len(evidenceIDs))
	for _, evidenceID := range evidenceIDs {
		if evidenceID <= 0 {
			return 0, fmt.Errorf("mã minh chứng không hợp lệ")
		}
		if _, exists := seen[evidenceID]; exists {
			continue
		}
		seen[evidenceID] = struct{}{}
		uniqueIDs = append(uniqueIDs, evidenceID)
	}
	return s.repo.ApproveEvidenceList(ctx, uniqueIDs)
}
