package repository

import (
	"context"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"tygrsec-academy-platform/internal/models"
)

// UserRepository handles user data access
type UserRepository interface {
	Create(ctx context.Context, user *models.User) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.User, error)
	GetByUsername(ctx context.Context, username string) (*models.User, error)
	GetByEmail(ctx context.Context, email string) (*models.User, error)
	GetByOAuth(ctx context.Context, provider, oauthID string) (*models.User, error)
	Update(ctx context.Context, user *models.User) error
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, offset, limit int) ([]models.User, error)
	Count(ctx context.Context) (int64, error)
	SavePathwayProgress(ctx context.Context, progress *models.UserPathwayProgress) error
	GetPathwayProgress(ctx context.Context, userID uuid.UUID) ([]models.UserPathwayProgress, error)
}

type userRepository struct {
	db *gorm.DB
}

// NewUserRepository creates a new UserRepository
func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) Create(ctx context.Context, user *models.User) error {
	return r.db.WithContext(ctx).Create(user).Error
}

func (r *userRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	var user models.User
	if err := r.db.WithContext(ctx).First(&user, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) GetByUsername(ctx context.Context, username string) (*models.User, error) {
	var user models.User
	if err := r.db.WithContext(ctx).First(&user, "username = ?", username).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	var user models.User
	if err := r.db.WithContext(ctx).First(&user, "email = ?", email).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) GetByOAuth(ctx context.Context, provider, oauthID string) (*models.User, error) {
	var user models.User
	if err := r.db.WithContext(ctx).First(&user, "oauth_provider = ? AND oauth_id = ?", provider, oauthID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) Update(ctx context.Context, user *models.User) error {
	return r.db.WithContext(ctx).Save(user).Error
}

func (r *userRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&models.User{}, "id = ?", id).Error
}

func (r *userRepository) List(ctx context.Context, offset, limit int) ([]models.User, error) {
	var users []models.User
	if err := r.db.WithContext(ctx).Order("xp DESC").Offset(offset).Limit(limit).Find(&users).Error; err != nil {
		return nil, err
	}
	return users, nil
}

func (r *userRepository) Count(ctx context.Context) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.User{}).Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

func (r *userRepository) SavePathwayProgress(ctx context.Context, progress *models.UserPathwayProgress) error {
	return r.db.WithContext(ctx).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "user_id"}, {Name: "pathway_id"}, {Name: "step_index"}},
		DoUpdates: clause.AssignmentColumns([]string{"time_spent", "xp_earned", "completed_at"}),
	}).Create(progress).Error
}

func (r *userRepository) GetPathwayProgress(ctx context.Context, userID uuid.UUID) ([]models.UserPathwayProgress, error) {
	var list []models.UserPathwayProgress
	if err := r.db.WithContext(ctx).Where("user_id = ?", userID).Order("completed_at ASC").Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}