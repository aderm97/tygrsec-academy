package repository

import (
	"context"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"tygrsec-academy-platform/internal/models"
)

// ChallengeRepository handles challenge data access
type ChallengeRepository interface {
	Create(ctx context.Context, challenge *models.Challenge) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.Challenge, error)
	GetBySlug(ctx context.Context, slug string) (*models.Challenge, error)
	Update(ctx context.Context, challenge *models.Challenge) error
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, filter models.ChallengeFilter) ([]models.Challenge, int64, error)
	GetFlags(ctx context.Context, challengeID uuid.UUID) ([]models.Flag, error)
	GetHints(ctx context.Context, challengeID uuid.UUID) ([]models.Hint, error)
	IncrementSolves(ctx context.Context, id uuid.UUID) error
	IncrementAttempts(ctx context.Context, id uuid.UUID) error
}

type challengeRepository struct {
	db *gorm.DB
}

// NewChallengeRepository creates a new ChallengeRepository
func NewChallengeRepository(db *gorm.DB) ChallengeRepository {
	return &challengeRepository{db: db}
}

func (r *challengeRepository) Create(ctx context.Context, challenge *models.Challenge) error {
	return r.db.WithContext(ctx).Create(challenge).Error
}

func (r *challengeRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Challenge, error) {
	var challenge models.Challenge
	if err := r.db.WithContext(ctx).
		Preload("Category").
		Preload("Hints").
		Preload("Attachments").
		Preload("Tags").
		First(&challenge, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &challenge, nil
}

func (r *challengeRepository) GetBySlug(ctx context.Context, slug string) (*models.Challenge, error) {
	var challenge models.Challenge
	if err := r.db.WithContext(ctx).
		Preload("Category").
		Preload("Hints").
		Preload("Attachments").
		Preload("Tags").
		First(&challenge, "slug = ?", slug).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &challenge, nil
}

func (r *challengeRepository) Update(ctx context.Context, challenge *models.Challenge) error {
	return r.db.WithContext(ctx).Save(challenge).Error
}

func (r *challengeRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&models.Challenge{}, "id = ?", id).Error
}

func (r *challengeRepository) List(ctx context.Context, filter models.ChallengeFilter) ([]models.Challenge, int64, error) {
	var challenges []models.Challenge
	var total int64

	query := r.db.WithContext(ctx).Model(&models.Challenge{}).Where("is_published = ? AND is_active = ?", true, true)

	// Apply filters
	if len(filter.Categories) > 0 {
		query = query.Where("category_id IN (?)", filter.Categories)
	}
	if len(filter.Difficulties) > 0 {
		query = query.Where("difficulty IN (?)", filter.Difficulties)
	}
	if len(filter.Types) > 0 {
		query = query.Where("type IN (?)", filter.Types)
	}
	if filter.Search != "" {
		searchPattern := "%" + filter.Search + "%"
		query = query.Where("title ILIKE ? OR description ILIKE ?", searchPattern, searchPattern)
	}

	// Count total
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply sorting
	sortBy := "created_at"
	sortOrder := "desc"
	if filter.SortBy != "" {
		sortBy = filter.SortBy
	}
	if filter.SortOrder != "" {
		sortOrder = filter.SortOrder
	}
	query = query.Order(sortBy + " " + sortOrder)

	// Apply pagination
	offset := (filter.Page - 1) * filter.PageSize
	if offset < 0 {
		offset = 0
	}
	if filter.PageSize <= 0 {
		filter.PageSize = 20
	}

	if err := query.
		Preload("Category").
		Preload("Tags").
		Offset(offset).
		Limit(filter.PageSize).
		Find(&challenges).Error; err != nil {
		return nil, 0, err
	}

	return challenges, total, nil
}

func (r *challengeRepository) GetFlags(ctx context.Context, challengeID uuid.UUID) ([]models.Flag, error) {
	var flags []models.Flag
	if err := r.db.WithContext(ctx).Where("challenge_id = ?", challengeID).Find(&flags).Error; err != nil {
		return nil, err
	}
	return flags, nil
}

func (r *challengeRepository) GetHints(ctx context.Context, challengeID uuid.UUID) ([]models.Hint, error) {
	var hints []models.Hint
	if err := r.db.WithContext(ctx).
		Where("challenge_id = ? AND is_active = ?", challengeID, true).
		Order("`order` ASC").
		Find(&hints).Error; err != nil {
		return nil, err
	}
	return hints, nil
}

func (r *challengeRepository) IncrementSolves(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Model(&models.Challenge{}).
		Where("id = ?", id).
		UpdateColumn("solves_count", gorm.Expr("solves_count + 1")).Error
}

func (r *challengeRepository) IncrementAttempts(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Model(&models.Challenge{}).
		Where("id = ?", id).
		UpdateColumn("attempts_count", gorm.Expr("attempts_count + 1")).Error
}