package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"renluyen-dlu-backend/internal/dto"
)

type activityRepositoryStub struct {
	manager      bool
	createCalled bool
	listCalled   bool
	lastMutation dto.ActivityMutation
	lastQuery    dto.ActivityQuery
}

type activityImageStorageStub struct {
	contentType string
	data        []byte
}

func (s *activityImageStorageStub) Save(_ context.Context, _ int64, contentType string, data []byte) error {
	s.contentType = contentType
	s.data = data
	return nil
}

func (*activityImageStorageStub) Get(context.Context, int64) ([]byte, string, error) {
	return nil, "", nil
}

func (r *activityRepositoryStub) ListActivities(_ context.Context, query dto.ActivityQuery) ([]dto.ActivityListItem, int64, error) {
	r.listCalled = true
	r.lastQuery = query
	return []dto.ActivityListItem{}, 0, nil
}

func (*activityRepositoryStub) GetActivity(context.Context, int64) (*dto.ActivityListItem, error) {
	return nil, nil
}

func (r *activityRepositoryStub) CanManageActivities(context.Context, int64) (bool, error) {
	return r.manager, nil
}

func (r *activityRepositoryStub) CanManageActivity(context.Context, int64, int64) (bool, error) {
	return r.manager, nil
}

func (r *activityRepositoryStub) CreateActivity(_ context.Context, input dto.ActivityMutation) (*dto.ActivityListItem, error) {
	r.createCalled = true
	r.lastMutation = input
	return &dto.ActivityListItem{}, nil
}

func (*activityRepositoryStub) UpdateActivity(context.Context, int64, dto.ActivityMutation) (*dto.ActivityListItem, error) {
	return &dto.ActivityListItem{}, nil
}

func (*activityRepositoryStub) DeleteActivity(context.Context, int64, int64) error {
	return nil
}

func (*activityRepositoryStub) RegisterStudent(context.Context, int64, int64) (*dto.ActivityRegistrationResult, error) {
	return &dto.ActivityRegistrationResult{}, nil
}

func TestListActivitiesRejectsInvalidDateRange(t *testing.T) {
	repo := &activityRepositoryStub{}
	svc := NewActivityService(repo)

	_, _, err := svc.ListActivities(context.Background(), dto.ActivityQuery{
		FromDate: "2026-10-10",
		ToDate:   "2026-10-09",
	})
	if !errors.Is(err, ErrInvalidActivity) {
		t.Fatalf("expected ErrInvalidActivity, got %v", err)
	}
	if repo.listCalled {
		t.Fatal("repository should not be called for an invalid date range")
	}
}

func TestListActivitiesTrimsSearchBeforeQuery(t *testing.T) {
	repo := &activityRepositoryStub{}
	svc := NewActivityService(repo)

	_, _, err := svc.ListActivities(context.Background(), dto.ActivityQuery{Search: "  volunteer  "})
	if err != nil {
		t.Fatalf("ListActivities returned an error: %v", err)
	}
	if !repo.listCalled || repo.lastQuery.Search != "volunteer" {
		t.Fatalf("expected trimmed search in repository query, got %+v", repo.lastQuery)
	}
}

func TestCreateActivityRequiresActiveManager(t *testing.T) {
	repo := &activityRepositoryStub{manager: false}
	svc := NewActivityService(repo)

	_, err := svc.CreateActivity(context.Background(), validActivityMutation())
	if !errors.Is(err, ErrNotActivityManager) {
		t.Fatalf("expected ErrNotActivityManager, got %v", err)
	}
	if repo.createCalled {
		t.Fatal("repository should not create an activity for a non-lecturer")
	}
}

func TestUploadActivityImageValidatesAndStoresImage(t *testing.T) {
	repo := &activityRepositoryStub{manager: true}
	images := &activityImageStorageStub{}
	svc := NewActivityService(repo, images)
	image := []byte("\x89PNG\r\n\x1a\n")

	contentType, err := svc.UploadActivityImage(context.Background(), 7, 12, image)
	if err != nil {
		t.Fatalf("UploadActivityImage returned an error: %v", err)
	}
	if contentType != "image/png" || images.contentType != contentType || string(images.data) != string(image) {
		t.Fatalf("expected PNG to be stored, got response type %q and stored type %q", contentType, images.contentType)
	}

	if _, err := svc.UploadActivityImage(context.Background(), 7, 12, []byte("not an image")); !errors.Is(err, ErrInvalidActivityImage) {
		t.Fatalf("expected ErrInvalidActivityImage for non-image data, got %v", err)
	}
}

func TestUploadActivityImageRequiresActivityPermission(t *testing.T) {
	svc := NewActivityService(&activityRepositoryStub{manager: false}, &activityImageStorageStub{})
	_, err := svc.UploadActivityImage(context.Background(), 7, 12, []byte("\x89PNG\r\n\x1a\n"))
	if !errors.Is(err, ErrNotActivityManager) {
		t.Fatalf("expected ErrNotActivityManager, got %v", err)
	}
}

func TestCreateActivityValidatesTimeAndTrimsFields(t *testing.T) {
	repo := &activityRepositoryStub{manager: true}
	svc := NewActivityService(repo)
	input := validActivityMutation()
	input.ActivityCode = "  ACT-NEW "
	input.Title = "  Volunteer Event  "
	input.Detail = "  Event details  "

	_, err := svc.CreateActivity(context.Background(), input)
	if err != nil {
		t.Fatalf("CreateActivity returned an error: %v", err)
	}
	if repo.lastMutation.ActivityCode != "" ||
		repo.lastMutation.Title != "Volunteer Event" ||
		repo.lastMutation.Detail != "Event details" {
		t.Fatalf("expected generated code and trimmed fields, got %+v", repo.lastMutation)
	}

	input.TimeEnd = input.TimeBegin
	if _, err := svc.CreateActivity(context.Background(), input); !errors.Is(err, ErrInvalidActivity) {
		t.Fatalf("expected ErrInvalidActivity for invalid time range, got %v", err)
	}
}

func validActivityMutation() dto.ActivityMutation {
	begin := time.Date(2026, time.November, 1, 8, 0, 0, 0, time.UTC)
	return dto.ActivityMutation{
		ActivityCode: "ACT-NEW",
		Title:        "Volunteer Event",
		TimeBegin:    begin,
		TimeEnd:      begin.Add(time.Hour),
		Slot:         20,
		Score:        5,
		Location:     "Hội trường A",
		UserID:       12,
	}
}
