package services

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"

	"tygrsec-academy-platform/internal/models"
	"tygrsec-academy-platform/internal/repository"
)

// UserRepository interface needed by gamification service
type UserRepository interface {
	GetByID(ctx context.Context, id uuid.UUID) (*models.User, error)
	Update(ctx context.Context, user *models.User) error
	List(ctx context.Context, offset, limit int) ([]models.User, error)
	SavePathwayProgress(ctx context.Context, progress *models.UserPathwayProgress) error
	GetPathwayProgress(ctx context.Context, userID uuid.UUID) ([]models.UserPathwayProgress, error)
}

// GamificationService handles gamification logic
type GamificationService struct {
	progressRepo repository.ProgressRepository
	badgeRepo    repository.BadgeRepository
	userRepo     UserRepository
}

// NewGamificationService creates a new GamificationService
func NewGamificationService(
	progressRepo repository.ProgressRepository,
	badgeRepo repository.BadgeRepository,
	userRepo UserRepository,
) *GamificationService {
	return &GamificationService{
		progressRepo: progressRepo,
		badgeRepo:    badgeRepo,
		userRepo:     userRepo,
	}
}

// AwardXP awards XP to a user and checks for level up
func (s *GamificationService) AwardXP(ctx context.Context, userID uuid.UUID, xp int) error {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return fmt.Errorf("failed to get user: %w", err)
	}

	if user == nil {
		return fmt.Errorf("user not found")
	}

	oldLevel := user.Level
	user.XP += xp
	newLevel := models.LevelFromXP(user.XP)

	if newLevel > oldLevel {
		user.Level = newLevel
	}

	return s.userRepo.Update(ctx, user)
}

// CheckAndAwardBadges checks if user qualifies for any badges
func (s *GamificationService) CheckAndAwardBadges(ctx context.Context, userID uuid.UUID) ([]models.Badge, error) {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	if user == nil {
		return nil, fmt.Errorf("user not found")
	}

	badges, err := s.badgeRepo.List(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to list badges: %w", err)
	}

	awardedBadges := []models.Badge{}

	for _, badge := range badges {
		if s.badgeRepo.HasBadge(ctx, userID, badge.ID) {
			continue
		}

		if !badge.IsAvailable() {
			continue
		}

		if s.meetsRequirements(user, &badge) {
			userBadge := &models.UserBadge{
				UserID:   userID,
				BadgeID:  badge.ID,
				EarnedAt: time.Now(),
				XPBonus:  badge.XPReward,
			}

			if err := s.badgeRepo.AwardBadge(ctx, userBadge); err != nil {
				continue
			}

			if badge.XPReward > 0 {
				s.AwardXP(ctx, userID, badge.XPReward)
			}

			awardedBadges = append(awardedBadges, badge)
		}
	}

	return awardedBadges, nil
}

// meetsRequirements checks if a user meets badge requirements
func (s *GamificationService) meetsRequirements(user *models.User, badge *models.Badge) bool {
	switch badge.RequirementType {
	case models.BadgeReqChallengesSolved:
		return user.ChallengesSolved >= badge.RequirementValue
	case models.BadgeReqFirstBlood:
		return user.FirstBloods >= badge.RequirementValue
	case models.BadgeReqStreak:
		return user.CurrentStreak >= badge.RequirementValue || user.BestStreak >= badge.RequirementValue
	case models.BadgeReqLevel:
		return user.Level >= badge.RequirementValue
	case models.BadgeReqXP:
		return user.XP >= badge.RequirementValue
	default:
		return false
	}
}

// UpdateStreak updates user's daily streak
func (s *GamificationService) UpdateStreak(ctx context.Context, userID uuid.UUID) error {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return err
	}

	now := time.Now()
	
	if user.StreakUpdatedAt != nil {
		lastUpdate := user.StreakUpdatedAt.Truncate(24 * time.Hour)
		today := now.Truncate(24 * time.Hour)
		yesterday := today.Add(-24 * time.Hour)

		if lastUpdate.Equal(yesterday) {
			user.CurrentStreak++
			if user.CurrentStreak > user.BestStreak {
				user.BestStreak = user.CurrentStreak
			}
		} else if lastUpdate.Before(yesterday) {
			user.CurrentStreak = 1
		}
	} else {
		user.CurrentStreak = 1
		user.BestStreak = 1
	}

	user.StreakUpdatedAt = &now
	return s.userRepo.Update(ctx, user)
}

// GetUserStats returns user statistics
func (s *GamificationService) GetUserStats(ctx context.Context, userID uuid.UUID) (*models.UserStats, error) {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	if user == nil {
		return nil, fmt.Errorf("user not found")
	}

	progress, err := s.progressRepo.GetByUser(ctx, userID)
	if err != nil {
		return nil, err
	}

	challengesAttempted := len(progress)
	totalSolveTime := 0
	for _, p := range progress {
		totalSolveTime += p.TimeSpent
	}

	var avgSolveTime float64
	if user.ChallengesSolved > 0 {
		avgSolveTime = float64(totalSolveTime) / float64(user.ChallengesSolved) / 60
	}

	return &models.UserStats{
		UserID:               user.ID,
		Username:             user.Username,
		DisplayName:          user.DisplayName,
		AvatarURL:            user.AvatarURL,
		Level:                user.Level,
		XP:                   user.XP,
		Rank:                 user.Rank,
		ChallengesSolved:     user.ChallengesSolved,
		ChallengesAttempted:  challengesAttempted,
		FirstBloods:          user.FirstBloods,
		CurrentStreak:        user.CurrentStreak,
		BestStreak:           user.BestStreak,
		AverageSolveTime:     avgSolveTime,
		BadgesEarned:         0,
		MemberSince:          user.CreatedAt,
	}, nil
}

// GetUserBadges returns user's earned badges
func (s *GamificationService) GetUserBadges(ctx context.Context, userID uuid.UUID) ([]models.UserBadge, error) {
	return s.badgeRepo.GetUserBadges(ctx, userID)
}

// GetUserProgress returns all user progress records
func (s *GamificationService) GetUserProgress(ctx context.Context, userID uuid.UUID) ([]models.UserProgress, error) {
	return s.progressRepo.GetByUser(ctx, userID)
}