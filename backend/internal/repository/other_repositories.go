package repository

import (
	"context"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"tygrsec-academy-platform/internal/models"
)

// SubmissionRepository handles submission data access
type SubmissionRepository interface {
	Create(ctx context.Context, submission *models.Submission) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.Submission, error)
	GetByUserAndChallenge(ctx context.Context, userID, challengeID uuid.UUID) ([]models.Submission, error)
	GetCorrectSubmissionsByUser(ctx context.Context, userID uuid.UUID) ([]models.Submission, error)
	IsFirstBlood(ctx context.Context, challengeID uuid.UUID) bool
}

type submissionRepository struct {
	db *gorm.DB
}

// NewSubmissionRepository creates a new SubmissionRepository
func NewSubmissionRepository(db *gorm.DB) SubmissionRepository {
	return &submissionRepository{db: db}
}

func (r *submissionRepository) Create(ctx context.Context, submission *models.Submission) error {
	return r.db.WithContext(ctx).Create(submission).Error
}

func (r *submissionRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Submission, error) {
	var submission models.Submission
	if err := r.db.WithContext(ctx).First(&submission, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &submission, nil
}

func (r *submissionRepository) GetByUserAndChallenge(ctx context.Context, userID, challengeID uuid.UUID) ([]models.Submission, error) {
	var submissions []models.Submission
	if err := r.db.WithContext(ctx).
		Where("user_id = ? AND challenge_id = ?", userID, challengeID).
		Order("submitted_at DESC").
		Find(&submissions).Error; err != nil {
		return nil, err
	}
	return submissions, nil
}

func (r *submissionRepository) GetCorrectSubmissionsByUser(ctx context.Context, userID uuid.UUID) ([]models.Submission, error) {
	var submissions []models.Submission
	if err := r.db.WithContext(ctx).
		Where("user_id = ? AND is_correct = ?", userID, true).
		Find(&submissions).Error; err != nil {
		return nil, err
	}
	return submissions, nil
}

func (r *submissionRepository) IsFirstBlood(ctx context.Context, challengeID uuid.UUID) bool {
	var count int64
	r.db.WithContext(ctx).Model(&models.Submission{}).
		Where("challenge_id = ? AND is_correct = ? AND is_first_blood = ?", challengeID, true, true).
		Count(&count)
	return count == 0
}

// ProgressRepository handles user progress data access
type ProgressRepository interface {
	Create(ctx context.Context, progress *models.UserProgress) error
	GetByUserAndChallenge(ctx context.Context, userID, challengeID uuid.UUID) (*models.UserProgress, error)
	Update(ctx context.Context, progress *models.UserProgress) error
	GetByUser(ctx context.Context, userID uuid.UUID) ([]models.UserProgress, error)
}

type progressRepository struct {
	db *gorm.DB
}

// NewProgressRepository creates a new ProgressRepository
func NewProgressRepository(db *gorm.DB) ProgressRepository {
	return &progressRepository{db: db}
}

func (r *progressRepository) Create(ctx context.Context, progress *models.UserProgress) error {
	return r.db.WithContext(ctx).Create(progress).Error
}

func (r *progressRepository) GetByUserAndChallenge(ctx context.Context, userID, challengeID uuid.UUID) (*models.UserProgress, error) {
	var progress models.UserProgress
	if err := r.db.WithContext(ctx).
		Where("user_id = ? AND challenge_id = ?", userID, challengeID).
		First(&progress).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &progress, nil
}

func (r *progressRepository) Update(ctx context.Context, progress *models.UserProgress) error {
	return r.db.WithContext(ctx).Save(progress).Error
}

func (r *progressRepository) GetByUser(ctx context.Context, userID uuid.UUID) ([]models.UserProgress, error) {
	var progress []models.UserProgress
	if err := r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Preload("Challenge").
		Find(&progress).Error; err != nil {
		return nil, err
	}
	return progress, nil
}

// BadgeRepository handles badge data access
type BadgeRepository interface {
	Create(ctx context.Context, badge *models.Badge) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.Badge, error)
	GetBySlug(ctx context.Context, slug string) (*models.Badge, error)
	List(ctx context.Context) ([]models.Badge, error)
	AwardBadge(ctx context.Context, userBadge *models.UserBadge) error
	GetUserBadges(ctx context.Context, userID uuid.UUID) ([]models.UserBadge, error)
	HasBadge(ctx context.Context, userID, badgeID uuid.UUID) bool
}

type badgeRepository struct {
	db *gorm.DB
}

// NewBadgeRepository creates a new BadgeRepository
func NewBadgeRepository(db *gorm.DB) BadgeRepository {
	return &badgeRepository{db: db}
}

func (r *badgeRepository) Create(ctx context.Context, badge *models.Badge) error {
	return r.db.WithContext(ctx).Create(badge).Error
}

func (r *badgeRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Badge, error) {
	var badge models.Badge
	if err := r.db.WithContext(ctx).First(&badge, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &badge, nil
}

func (r *badgeRepository) GetBySlug(ctx context.Context, slug string) (*models.Badge, error) {
	var badge models.Badge
	if err := r.db.WithContext(ctx).First(&badge, "slug = ?", slug).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &badge, nil
}

func (r *badgeRepository) List(ctx context.Context) ([]models.Badge, error) {
	var badges []models.Badge
	if err := r.db.WithContext(ctx).Where("is_active = ?", true).Find(&badges).Error; err != nil {
		return nil, err
	}
	return badges, nil
}

func (r *badgeRepository) AwardBadge(ctx context.Context, userBadge *models.UserBadge) error {
	return r.db.WithContext(ctx).Create(userBadge).Error
}

func (r *badgeRepository) GetUserBadges(ctx context.Context, userID uuid.UUID) ([]models.UserBadge, error) {
	var userBadges []models.UserBadge
	if err := r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Preload("Badge").
		Order("earned_at DESC").
		Find(&userBadges).Error; err != nil {
		return nil, err
	}
	return userBadges, nil
}

func (r *badgeRepository) HasBadge(ctx context.Context, userID, badgeID uuid.UUID) bool {
	var count int64
	r.db.WithContext(ctx).Model(&models.UserBadge{}).
		Where("user_id = ? AND badge_id = ?", userID, badgeID).
		Count(&count)
	return count > 0
}

// LabRepository handles lab data access
type LabRepository interface {
	Create(ctx context.Context, lab *models.Lab) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.Lab, error)
	GetByUserAndChallenge(ctx context.Context, userID, challengeID uuid.UUID) (*models.Lab, error)
	GetActiveByUser(ctx context.Context, userID uuid.UUID) ([]models.Lab, error)
	Update(ctx context.Context, lab *models.Lab) error
	Delete(ctx context.Context, id uuid.UUID) error
	GetExpiredLabs(ctx context.Context) ([]models.Lab, error)
}

type labRepository struct {
	db *gorm.DB
}

// NewLabRepository creates a new LabRepository
func NewLabRepository(db *gorm.DB) LabRepository {
	return &labRepository{db: db}
}

func (r *labRepository) Create(ctx context.Context, lab *models.Lab) error {
	return r.db.WithContext(ctx).Create(lab).Error
}

func (r *labRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Lab, error) {
	var lab models.Lab
	if err := r.db.WithContext(ctx).Preload("Ports").First(&lab, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &lab, nil
}

func (r *labRepository) GetByUserAndChallenge(ctx context.Context, userID, challengeID uuid.UUID) (*models.Lab, error) {
	var lab models.Lab
	if err := r.db.WithContext(ctx).
		Preload("Ports").
		Where("user_id = ? AND challenge_id = ? AND status IN (?)", userID, challengeID, []models.LabStatus{models.LabStatusRunning, models.LabStatusCreating}).
		First(&lab).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &lab, nil
}

func (r *labRepository) GetActiveByUser(ctx context.Context, userID uuid.UUID) ([]models.Lab, error) {
	var labs []models.Lab
	if err := r.db.WithContext(ctx).
		Preload("Ports").
		Preload("Challenge").
		Where("user_id = ? AND status IN (?)", userID, []models.LabStatus{models.LabStatusRunning, models.LabStatusCreating, models.LabStatusPaused}).
		Find(&labs).Error; err != nil {
		return nil, err
	}
	return labs, nil
}

func (r *labRepository) Update(ctx context.Context, lab *models.Lab) error {
	return r.db.WithContext(ctx).Save(lab).Error
}

func (r *labRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&models.Lab{}, "id = ?", id).Error
}

func (r *labRepository) GetExpiredLabs(ctx context.Context) ([]models.Lab, error) {
	var labs []models.Lab
	if err := r.db.WithContext(ctx).
		Where("expires_at < NOW() AND status = ?", models.LabStatusRunning).
		Find(&labs).Error; err != nil {
		return nil, err
	}
	return labs, nil
}