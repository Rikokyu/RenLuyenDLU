package service

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"renluyen-dlu-backend/internal/dto"
	"renluyen-dlu-backend/internal/repository"
	"renluyen-dlu-backend/internal/storage"
)

var (
	ErrInvalidActivity      = errors.New("invalid activity input")
	ErrNotActivityManager   = errors.New("an active activity manager account is required")
	ErrInvalidActivityImage = errors.New("invalid activity image")
)

var (
	ErrActivityCodeConflict       = repository.ErrActivityCodeConflict
	ErrActivityNotOwned           = repository.ErrActivityNotOwned
	ErrActivityRegistrationClosed = repository.ErrActivityRegistrationClosed
	ErrActivityAlreadyRegistered  = repository.ErrActivityAlreadyRegistered
	ErrActivityFull               = repository.ErrActivityFull
)

type ActivityService interface {
	ListActivities(ctx context.Context, query dto.ActivityQuery) ([]dto.ActivityListItem, int64, error)
	GetActivity(ctx context.Context, id int64) (*dto.ActivityListItem, error)
	CreateActivity(ctx context.Context, input dto.ActivityMutation) (*dto.ActivityListItem, error)
	UpdateActivity(ctx context.Context, id int64, input dto.ActivityMutation) (*dto.ActivityListItem, error)
	DeleteActivity(ctx context.Context, id, userID int64) error
	RegisterStudent(ctx context.Context, activityID, userID int64) (*dto.ActivityRegistrationResult, error)
	UploadActivityImage(ctx context.Context, userID, activityID int64, data []byte) (string, error)
	GetActivityImage(ctx context.Context, activityID int64) ([]byte, string, error)
}

type activityService struct {
	repo   repository.ActivityRepository
	images storage.ActivityImages
}

func NewActivityService(repo repository.ActivityRepository, images ...storage.ActivityImages) ActivityService {
	var imageStorage storage.ActivityImages
	if len(images) > 0 {
		imageStorage = images[0]
	}
	return &activityService{repo: repo, images: imageStorage}
}

func (s *activityService) ListActivities(
	ctx context.Context,
	query dto.ActivityQuery,
) ([]dto.ActivityListItem, int64, error) {
	if query.Status != nil && (*query.Status < 0 || *query.Status > 1) {
		return nil, 0, fmt.Errorf("%w: status must be 0 or 1", ErrInvalidActivity)
	}
	var from, to time.Time
	var err error
	if query.FromDate != "" {
		from, err = time.Parse("2006-01-02", query.FromDate)
		if err != nil {
			return nil, 0, fmt.Errorf("%w: from_date must use YYYY-MM-DD", ErrInvalidActivity)
		}
	}
	if query.ToDate != "" {
		to, err = time.Parse("2006-01-02", query.ToDate)
		if err != nil {
			return nil, 0, fmt.Errorf("%w: to_date must use YYYY-MM-DD", ErrInvalidActivity)
		}
	}
	if !from.IsZero() && !to.IsZero() && from.After(to) {
		return nil, 0, fmt.Errorf("%w: from_date must not be after to_date", ErrInvalidActivity)
	}
	query.Search = strings.TrimSpace(query.Search)
	return s.repo.ListActivities(ctx, query)
}

func (s *activityService) GetActivity(ctx context.Context, id int64) (*dto.ActivityListItem, error) {
	if id <= 0 {
		return nil, fmt.Errorf("%w: activity id must be positive", ErrInvalidActivity)
	}
	return s.repo.GetActivity(ctx, id)
}

func (s *activityService) CreateActivity(
	ctx context.Context,
	input dto.ActivityMutation,
) (*dto.ActivityListItem, error) {
	input.ActivityCode = ""
	if err := validateActivityMutation(&input, false); err != nil {
		return nil, err
	}
	allowed, err := s.repo.CanManageActivities(ctx, input.UserID)
	if err != nil {
		return nil, err
	}
	if !allowed {
		return nil, ErrNotActivityManager
	}
	return s.repo.CreateActivity(ctx, input)
}

func (s *activityService) UpdateActivity(
	ctx context.Context,
	id int64,
	input dto.ActivityMutation,
) (*dto.ActivityListItem, error) {
	if id <= 0 {
		return nil, fmt.Errorf("%w: activity id must be positive", ErrInvalidActivity)
	}
	if err := validateActivityMutation(&input, true); err != nil {
		return nil, err
	}
	allowed, err := s.repo.CanManageActivities(ctx, input.UserID)
	if err != nil {
		return nil, err
	}
	if !allowed {
		return nil, ErrNotActivityManager
	}
	return s.repo.UpdateActivity(ctx, id, input)
}

func (s *activityService) DeleteActivity(ctx context.Context, id, userID int64) error {
	if id <= 0 || userID <= 0 {
		return fmt.Errorf("%w: activity id and user id must be positive", ErrInvalidActivity)
	}
	allowed, err := s.repo.CanManageActivities(ctx, userID)
	if err != nil {
		return err
	}
	if !allowed {
		return ErrNotActivityManager
	}
	return s.repo.DeleteActivity(ctx, id, userID)
}

func (s *activityService) RegisterStudent(
	ctx context.Context,
	activityID,
	userID int64,
) (*dto.ActivityRegistrationResult, error) {
	if activityID <= 0 || userID <= 0 {
		return nil, fmt.Errorf("%w: activity id and authenticated user id are required", ErrInvalidActivity)
	}
	return s.repo.RegisterStudent(ctx, activityID, userID)
}

func (s *activityService) UploadActivityImage(
	ctx context.Context,
	userID,
	activityID int64,
	data []byte,
) (string, error) {
	if userID <= 0 || activityID <= 0 {
		return "", fmt.Errorf("%w: activity image requires a valid user and activity", ErrInvalidActivityImage)
	}
	if len(data) == 0 || len(data) > 5*1024*1024 {
		return "", fmt.Errorf("%w: image must be between 1 byte and 5 MB", ErrInvalidActivityImage)
	}
	contentType := http.DetectContentType(data)
	switch contentType {
	case "image/jpeg", "image/png", "image/gif", "image/webp":
	default:
		return "", fmt.Errorf("%w: only JPEG, PNG, GIF or WebP images are accepted", ErrInvalidActivityImage)
	}
	allowed, err := s.repo.CanManageActivity(ctx, userID, activityID)
	if err != nil {
		return "", err
	}
	if !allowed {
		return "", ErrNotActivityManager
	}
	if s.images == nil {
		return "", errors.New("activity image storage is not configured")
	}
	if err := s.images.Save(ctx, activityID, contentType, data); err != nil {
		return "", err
	}
	return contentType, nil
}

func (s *activityService) GetActivityImage(
	ctx context.Context,
	activityID int64,
) ([]byte, string, error) {
	if activityID <= 0 {
		return nil, "", fmt.Errorf("%w: activity id must be positive", ErrInvalidActivityImage)
	}
	if _, err := s.repo.GetActivity(ctx, activityID); err != nil {
		return nil, "", err
	}
	if s.images == nil {
		return nil, "", errors.New("activity image storage is not configured")
	}
	return s.images.Get(ctx, activityID)
}

func validateActivityMutation(input *dto.ActivityMutation, requireActivityCode bool) error {
	input.ActivityCode = strings.TrimSpace(input.ActivityCode)
	input.Title = strings.TrimSpace(input.Title)
	input.Location = strings.TrimSpace(input.Location)
	if (requireActivityCode && input.ActivityCode == "") || input.Title == "" ||
		input.Location == "" || input.UserID <= 0 || input.Slot <= 0 || input.Score < 0 ||
		input.TimeBegin.IsZero() || input.TimeEnd.IsZero() ||
		!input.TimeEnd.After(input.TimeBegin) {
		requiredFields := "title, positive slot/user id and a valid time range are required"
		if requireActivityCode {
			requiredFields = "code, " + requiredFields
		}
		return fmt.Errorf("%w: %s", ErrInvalidActivity, requiredFields)
	}
	if input.AddressDetailID != nil && *input.AddressDetailID <= 0 {
		return fmt.Errorf("%w: address detail id must be positive", ErrInvalidActivity)
	}
	input.Detail = strings.TrimSpace(input.Detail)
	return nil
}
