package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"renluyen-dlu-backend/internal/dto"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var (
	ErrActivityCodeConflict       = errors.New("activity code already exists")
	ErrActivityNotOwned           = errors.New("activity is not owned by this lecturer")
	ErrActivityRegistrationClosed = errors.New("activity registration is closed")
	ErrActivityAlreadyRegistered  = errors.New("student is already registered")
	ErrActivityFull               = errors.New("activity has no available slots")
)

var clauseLockUpdate = clause.Locking{Strength: "UPDATE"}

type ActivityRepository interface {
	ListActivities(ctx context.Context, query dto.ActivityQuery) ([]dto.ActivityListItem, int64, error)
	GetActivity(ctx context.Context, id int64) (*dto.ActivityListItem, error)
	CanManageActivities(ctx context.Context, userID int64) (bool, error)
	CanManageActivity(ctx context.Context, userID, activityID int64) (bool, error)
	CreateActivity(ctx context.Context, activity dto.ActivityMutation) (*dto.ActivityListItem, error)
	UpdateActivity(ctx context.Context, id int64, activity dto.ActivityMutation) (*dto.ActivityListItem, error)
	DeleteActivity(ctx context.Context, id, userID int64) error
	RegisterStudent(ctx context.Context, activityID, userID int64) (*dto.ActivityRegistrationResult, error)
}

type activityRepository struct {
	db *gorm.DB
}

func NewActivityRepository(db *gorm.DB) ActivityRepository {
	return &activityRepository{db: db}
}

const activityListSelect = `
	a.id AS id,
	a.activity_code AS activity_code,
	a.title AS title,
	COALESCE(CONCAT_WS(' ', u.firstname, u.lastname), '') AS organizer,
	a.timebegin AS time_begin,
	a.timeend AS time_end,
	COALESCE(a.slot, 0) AS slot,
	(SELECT COUNT(*) FROM activity_registration ar
	 WHERE ar.idactivity = a.id AND COALESCE(ar.status, 0) = 1) AS registered_count,
	COALESCE(a.score, 0) AS score,
	COALESCE(a.status, 0) AS status,
	COALESCE(a.detail, '') AS detail,
	a.iduser AS user_id,
	COALESCE(activity_location.location, '') AS location
`

const activityLocationJoin = `
	LEFT JOIN LATERAL (
		SELECT NULLIF(CONCAT_WS(', ',
			NULLIF(ad.building, ''),
			NULLIF(ad.note, ''),
			NULLIF(addr.number, ''),
			NULLIF(addr.street, ''),
			NULLIF(addr.ward, ''),
			NULLIF(addr.district, ''),
			NULLIF(addr.city, '')
		), '') AS location
		FROM address_activity aa
		JOIN address_detail ad ON ad.id = aa.idadd_detail
		LEFT JOIN address addr ON addr.id = ad.idaddress
		WHERE aa.idactivity = a.id
		ORDER BY aa.idadd_detail
		LIMIT 1
	) activity_location ON TRUE
`

func (r *activityRepository) ListActivities(
	ctx context.Context,
	req dto.ActivityQuery,
) ([]dto.ActivityListItem, int64, error) {
	var items []dto.ActivityListItem
	var total int64
	query := r.db.WithContext(ctx).
		Table(`activity a`).
		Joins(`LEFT JOIN "User" u ON u.id = a.iduser`).
		Joins(activityLocationJoin)
	if req.Status == nil {
		query = query.Where(`COALESCE(a.status, 0) <> 0`)
	}

	if req.Search != "" {
		pattern := "%" + strings.TrimSpace(req.Search) + "%"
		query = query.Where(`
			a.activity_code ILIKE ?
			OR a.title ILIKE ?
			OR COALESCE(a.detail, '') ILIKE ?
			OR CONCAT_WS(' ', u.firstname, u.lastname) ILIKE ?
			OR COALESCE(activity_location.location, '') ILIKE ?
		`, pattern, pattern, pattern, pattern, pattern)
	}
	if req.Status != nil {
		query = query.Where(`a.status = ?`, *req.Status)
	}
	if req.FromDate != "" {
		query = query.Where(`a.timebegin >= ?::date`, req.FromDate)
	}
	if req.ToDate != "" {
		query = query.Where(`a.timebegin < (?::date + INTERVAL '1 day')`, req.ToDate)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err := query.Select(activityListSelect).
		Order(`
			CASE
				WHEN UPPER(a.activity_code) ~ '^ACT[0-9]+$'
				THEN SUBSTRING(UPPER(a.activity_code) FROM '^ACT([0-9]+)$')::NUMERIC
				ELSE NULL
			END ASC NULLS LAST,
			UPPER(a.activity_code) ASC,
			a.id ASC
		`).
		Scan(&items).Error
	return items, total, err
}

func (r *activityRepository) GetActivity(
	ctx context.Context,
	id int64,
) (*dto.ActivityListItem, error) {
	var item dto.ActivityListItem
	err := r.db.WithContext(ctx).
		Table(`activity a`).
		Joins(`LEFT JOIN "User" u ON u.id = a.iduser`).
		Joins(activityLocationJoin).
		Where(`a.id = ? AND COALESCE(a.status, 0) <> 0`, id).
		Select(activityListSelect).
		Take(&item).Error
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *activityRepository) CanManageActivities(ctx context.Context, userID int64) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Table(`"User" u`).
		Joins(`JOIN role r ON r.id = u.idrole`).
		Where(`u.id = ?`, userID).
		Where(`COALESCE(u.status, 1) <> 0 AND COALESCE(r.status, 1) <> 0`).
		Where(`(
			u.idrole IN (1, 2)
			OR (
				u.idrole = 3
				AND EXISTS (SELECT 1 FROM lecturer l WHERE l.iduser = u.id)
			)
		)`).
		Count(&count).Error
	return count > 0, err
}

func (r *activityRepository) CanManageActivity(ctx context.Context, userID, activityID int64) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Table(`activity a`).
		Joins(`JOIN "User" u ON u.id = ?`, userID).
		Joins(`JOIN role r ON r.id = u.idrole`).
		Where(`a.id = ? AND COALESCE(a.status, 0) <> 0`, activityID).
		Where(`COALESCE(u.status, 1) <> 0 AND COALESCE(r.status, 1) <> 0`).
		Where(`(u.idrole IN (1, 2) OR (u.idrole = 3 AND a.iduser = u.id))`).
		Count(&count).Error
	return count > 0, err
}

func (r *activityRepository) CreateActivity(
	ctx context.Context,
	input dto.ActivityMutation,
) (*dto.ActivityListItem, error) {
	var id int64
	var activityCode string
	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Exec(`LOCK TABLE activity IN EXCLUSIVE MODE`).Error; err != nil {
			return err
		}
		var nextActivityNumber int64
		if err := tx.Raw(`
			SELECT COALESCE(MAX(SUBSTRING(UPPER(activity_code) FROM '^ACT([0-9]+)$')::BIGINT), 0) + 1
			FROM activity
			WHERE UPPER(activity_code) ~ '^ACT[0-9]+$'
		`).Scan(&nextActivityNumber).Error; err != nil {
			return err
		}
		activityCode = fmt.Sprintf("ACT%02d", nextActivityNumber)
		if err := tx.Raw(`SELECT COALESCE(MAX(id), 0) + 1 FROM activity`).Scan(&id).Error; err != nil {
			return err
		}
		if err := tx.Exec(`
			INSERT INTO activity
				(id, activity_code, title, timebegin, timeend, slot, detail, score, status, iduser)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
		`, id, activityCode, input.Title, input.TimeBegin, input.TimeEnd,
			input.Slot, input.Detail, input.Score, input.UserID).Error; err != nil {
			return err
		}
		return attachActivityLocationText(tx, id, input.Location)
	})
	if err != nil {
		return nil, err
	}
	return r.GetActivity(ctx, id)
}

func (r *activityRepository) UpdateActivity(
	ctx context.Context,
	id int64,
	input dto.ActivityMutation,
) (*dto.ActivityListItem, error) {
	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var activity struct {
			ID     int64 `gorm:"column:id"`
			UserID int64 `gorm:"column:iduser"`
		}
		if err := tx.Table(`activity`).
			Select(`id, iduser`).
			Where(`id = ? AND COALESCE(status, 0) <> 0`, id).
			Clauses(clauseLockUpdate).
			Take(&activity).Error; err != nil {
			return err
		}
		if activity.UserID != input.UserID {
			canManageAll, err := canManageAllActivities(tx, input.UserID)
			if err != nil {
				return err
			}
			if !canManageAll {
				return ErrActivityNotOwned
			}
		}
		var duplicate int64
		if err := tx.Table(`activity`).
			Where(`lower(activity_code) = lower(?) AND id <> ?`, input.ActivityCode, id).
			Count(&duplicate).Error; err != nil {
			return err
		}
		if duplicate > 0 {
			return ErrActivityCodeConflict
		}
		result := tx.Exec(`
			UPDATE activity
			SET activity_code = ?, title = ?, timebegin = ?, timeend = ?,
			    slot = ?, detail = ?, score = ?
			WHERE id = ? AND COALESCE(status, 0) <> 0
		`, input.ActivityCode, input.Title, input.TimeBegin, input.TimeEnd,
			input.Slot, input.Detail, input.Score, id)
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			return gorm.ErrRecordNotFound
		}
		if input.Location != "" || input.AddressDetailID != nil {
			if err := tx.Table(`address_activity`).
				Where(`idactivity = ?`, id).
				Delete(&struct{}{}).Error; err != nil {
				return err
			}
			if input.Location != "" {
				return attachActivityLocationText(tx, id, input.Location)
			}
			return attachActivityLocation(tx, id, input.AddressDetailID)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return r.GetActivity(ctx, id)
}

func (r *activityRepository) DeleteActivity(ctx context.Context, id, userID int64) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var activity struct {
			UserID int64 `gorm:"column:iduser"`
		}
		err := tx.Table(`activity`).
			Select(`iduser`).
			Where(`id = ? AND COALESCE(status, 0) <> 0`, id).
			Clauses(clauseLockUpdate).
			Take(&activity).Error
		if err != nil {
			return err
		}
		if activity.UserID != userID {
			canManageAll, err := canManageAllActivities(tx, userID)
			if err != nil {
				return err
			}
			if !canManageAll {
				return ErrActivityNotOwned
			}
		}
		result := tx.Table(`activity`).
			Where(`id = ? AND COALESCE(status, 0) <> 0`, id).
			Update(`status`, 0)
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			return gorm.ErrRecordNotFound
		}
		return nil
	})
}

func canManageAllActivities(db *gorm.DB, userID int64) (bool, error) {
	var count int64
	err := db.Table(`"User"`).
		Where(`id = ? AND idrole IN (1, 2) AND COALESCE(status, 1) <> 0`, userID).
		Count(&count).Error
	return count > 0, err
}

func (r *activityRepository) RegisterStudent(
	ctx context.Context,
	activityID,
	userID int64,
) (*dto.ActivityRegistrationResult, error) {
	var result dto.ActivityRegistrationResult
	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var activity struct {
			ID      int64     `gorm:"column:id"`
			TimeEnd time.Time `gorm:"column:timeend"`
			Slot    int       `gorm:"column:slot"`
		}
		if err := tx.Table(`activity`).
			Select(`id, timeend, slot`).
			Where(`id = ? AND COALESCE(status, 0) = 1`, activityID).
			Clauses(clauseLockUpdate).
			Take(&activity).Error; err != nil {
			return err
		}
		if !activity.TimeEnd.After(time.Now()) {
			return ErrActivityRegistrationClosed
		}
		var studentID int64
		if err := tx.Table(`student s`).
			Select(`s.id`).
			Joins(`JOIN "User" u ON u.id = s.iduser`).
			Where(`s.iduser = ? AND COALESCE(u.status, 1) <> 0`, userID).
			Take(&studentID).Error; err != nil {
			return err
		}
		var studentCode string
		if err := tx.Table(`student`).Select(`student_code`).
			Where(`id = ?`, studentID).Take(&studentCode).Error; err != nil {
			return err
		}
		var existing struct {
			ID     int64 `gorm:"column:id"`
			Status int   `gorm:"column:status"`
		}
		var activeCount int64
		if err := tx.Table(`activity_registration`).
			Where(`idactivity = ? AND idstudent = ? AND COALESCE(status, 0) = 1`, activityID, studentID).
			Count(&activeCount).Error; err != nil {
			return err
		}
		if activeCount > 0 {
			return ErrActivityAlreadyRegistered
		}
		err := tx.Table(`activity_registration`).
			Select(`id, status`).
			Where(`idactivity = ? AND idstudent = ?`, activityID, studentID).
			Where(`COALESCE(status, 0) = 0`).
			Order(`id DESC`).
			Take(&existing).Error
		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			return err
		}
		var registered int64
		if err := tx.Table(`activity_registration`).
			Where(`idactivity = ? AND COALESCE(status, 0) = 1`, activityID).
			Count(&registered).Error; err != nil {
			return err
		}
		if registered >= int64(activity.Slot) {
			return ErrActivityFull
		}
		now := time.Now()
		if err == nil {
			if updateErr := tx.Table(`activity_registration`).
				Where(`id = ?`, existing.ID).
				Updates(map[string]any{"registeredat": now, "status": 1}).Error; updateErr != nil {
				return updateErr
			}
			result = dto.ActivityRegistrationResult{
				RegistrationID: existing.ID,
				ActivityID:     activityID,
				StudentCode:    studentCode,
				RegisteredAt:   now,
				Status:         1,
			}
			return nil
		}
		if err := tx.Exec(`LOCK TABLE activity_registration IN EXCLUSIVE MODE`).Error; err != nil {
			return err
		}
		var registrationID int64
		if err := tx.Raw(`SELECT COALESCE(MAX(id), 0) + 1 FROM activity_registration`).Scan(&registrationID).Error; err != nil {
			return err
		}
		if err := tx.Exec(`
			INSERT INTO activity_registration (id, registeredat, status, idstudent, idactivity)
			VALUES (?, ?, 1, ?, ?)
		`, registrationID, now, studentID, activityID).Error; err != nil {
			return err
		}
		result = dto.ActivityRegistrationResult{
			RegistrationID: registrationID,
			ActivityID:     activityID,
			StudentCode:    studentCode,
			RegisteredAt:   now,
			Status:         1,
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return &result, nil
}

func attachActivityLocation(tx *gorm.DB, activityID int64, addressDetailID *int64) error {
	if addressDetailID == nil {
		return nil
	}
	var count int64
	if err := tx.Table(`address_detail`).
		Where(`id = ?`, *addressDetailID).
		Count(&count).Error; err != nil {
		return err
	}
	if count == 0 {
		return gorm.ErrRecordNotFound
	}
	var existing int64
	if err := tx.Table(`address_activity`).
		Where(`idactivity = ? AND idadd_detail = ?`, activityID, *addressDetailID).
		Count(&existing).Error; err != nil {
		return err
	}
	if existing > 0 {
		return nil
	}
	return tx.Exec(`INSERT INTO address_activity (idactivity, idadd_detail) VALUES (?, ?)`,
		activityID, *addressDetailID).Error
}

func attachActivityLocationText(tx *gorm.DB, activityID int64, location string) error {
	if err := tx.Exec(`LOCK TABLE address, address_detail IN EXCLUSIVE MODE`).Error; err != nil {
		return err
	}
	var addressID, detailID int64
	if err := tx.Raw(`SELECT COALESCE(MAX(id), 0) + 1 FROM address`).Scan(&addressID).Error; err != nil {
		return err
	}
	if err := tx.Exec(`
		INSERT INTO address (id, number, street, status)
		VALUES (?, '', ?, 1)
	`, addressID, location).Error; err != nil {
		return err
	}
	if err := tx.Raw(`SELECT COALESCE(MAX(id), 0) + 1 FROM address_detail`).Scan(&detailID).Error; err != nil {
		return err
	}
	if err := tx.Exec(`
		INSERT INTO address_detail (id, building, note, idaddress)
		VALUES (?, '', '', ?)
	`, detailID, addressID).Error; err != nil {
		return err
	}
	return tx.Exec(`
		INSERT INTO address_activity (idactivity, idadd_detail)
		VALUES (?, ?)
	`, activityID, detailID).Error
}
