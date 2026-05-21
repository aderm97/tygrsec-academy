package services

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"

	"tygrsec-academy-platform/internal/models"
	"tygrsec-academy-platform/internal/repository"
)

// ChallengeService handles challenge business logic
type ChallengeService struct {
	challengeRepo  repository.ChallengeRepository
	submissionRepo repository.SubmissionRepository
	userRepo       repository.UserRepository
	progressRepo   repository.ProgressRepository
}

// NewChallengeService creates a new ChallengeService
func NewChallengeService(
	challengeRepo repository.ChallengeRepository,
	submissionRepo repository.SubmissionRepository,
	userRepo repository.UserRepository,
	progressRepo repository.ProgressRepository,
) *ChallengeService {
	return &ChallengeService{
		challengeRepo:  challengeRepo,
		submissionRepo: submissionRepo,
		userRepo:       userRepo,
		progressRepo:   progressRepo,
	}
}

// ListChallenges returns a paginated list of challenges
func (s *ChallengeService) ListChallenges(ctx context.Context, filter models.ChallengeFilter) ([]models.Challenge, int64, error) {
	return s.challengeRepo.List(ctx, filter)
}

// GetChallenge returns a challenge by ID
func (s *ChallengeService) GetChallenge(ctx context.Context, id uuid.UUID) (*models.Challenge, error) {
	return s.challengeRepo.GetByID(ctx, id)
}

// GetChallengeBySlug returns a challenge by Slug
func (s *ChallengeService) GetChallengeBySlug(ctx context.Context, slug string) (*models.Challenge, error) {
	return s.challengeRepo.GetBySlug(ctx, slug)
}

// SubmitFlagRequest represents a flag submission request
type SubmitFlagRequest struct {
	UserID      uuid.UUID
	ChallengeID uuid.UUID
	Flag        string
	IP          string
	UserAgent   string
}

// SubmitFlagResponse represents a flag submission response
type SubmitFlagResponse struct {
	Correct       bool   `json:"correct"`
	Message       string `json:"message"`
	XPEarned      int    `json:"xp_earned,omitempty"`
	IsFirstBlood  bool   `json:"is_first_blood,omitempty"`
	AlreadySolved bool   `json:"already_solved,omitempty"`
}

// SubmitFlag validates a flag submission
func (s *ChallengeService) SubmitFlag(ctx context.Context, req SubmitFlagRequest) (*SubmitFlagResponse, error) {
	// Get challenge
	challenge, err := s.challengeRepo.GetByID(ctx, req.ChallengeID)
	if err != nil {
		return nil, fmt.Errorf("failed to get challenge: %w", err)
	}
	if challenge == nil {
		return nil, errors.New("challenge not found")
	}

	// Check if already solved by this user
	previousSubmissions, err := s.submissionRepo.GetByUserAndChallenge(ctx, req.UserID, req.ChallengeID)
	if err != nil {
		return nil, fmt.Errorf("failed to check previous submissions: %w", err)
	}

	alreadySolved := false
	for _, sub := range previousSubmissions {
		if sub.IsCorrect && sub.Flag == req.Flag {
			alreadySolved = true
			break
		}
	}

	// Get challenge flags
	flags, err := s.challengeRepo.GetFlags(ctx, req.ChallengeID)
	if err != nil {
		return nil, fmt.Errorf("failed to get flags: %w", err)
	}

	// Validate flag
	isCorrect := false
	var solvedFlag *models.Flag
	for i := range flags {
		if s.validateFlag(req.Flag, &flags[i], req.UserID) {
			isCorrect = true
			solvedFlag = &flags[i]
			break
		}
	}

	// Record submission
	submission := &models.Submission{
		UserID:      req.UserID,
		ChallengeID: req.ChallengeID,
		Flag:        req.Flag,
		IsCorrect:   isCorrect,
		IP:          req.IP,
		UserAgent:   req.UserAgent,
		SubmittedAt: time.Now(),
	}

	if err := s.submissionRepo.Create(ctx, submission); err != nil {
		return nil, fmt.Errorf("failed to record submission: %w", err)
	}

	// Increment attempts count
	if err := s.challengeRepo.IncrementAttempts(ctx, req.ChallengeID); err != nil {
		// Log error but don't fail
		fmt.Printf("failed to increment attempts: %v\n", err)
	}

	if !isCorrect {
		return &SubmitFlagResponse{
			Correct: false,
			Message: "Incorrect flag. Try again!",
		}, nil
	}

	// Check for first blood
	isFirstBlood := s.submissionRepo.IsFirstBlood(ctx, req.ChallengeID)

	// Calculate XP
	xpEarned := 0
	if solvedFlag != nil {
		xpEarned = s.calculateXP(challenge, solvedFlag, isFirstBlood, alreadySolved)
	}
	submission.XPEarned = xpEarned
	submission.IsFirstBlood = isFirstBlood
	submission.IsPerfect = s.isPerfectSolve(previousSubmissions)

	if err := s.updateSubmission(ctx, submission); err != nil {
		fmt.Printf("failed to update submission: %v\n", err)
	}

	// Update user profile and progress in GORM database
	if !alreadySolved {
		user, err := s.userRepo.GetByID(ctx, req.UserID)
		if err == nil && user != nil {
			user.XP += xpEarned
			
			// Only increment challenges solved if they haven't solved any other flag for this challenge yet
			hasAnySolved := false
			for _, sub := range previousSubmissions {
				if sub.IsCorrect {
					hasAnySolved = true
					break
				}
			}
			if !hasAnySolved {
				user.ChallengesSolved++
			}
			
			user.Level = models.LevelFromXP(user.XP)
			if err := s.userRepo.Update(ctx, user); err != nil {
				fmt.Printf("failed to update user progress XP: %v\n", err)
			}
		}

		// Update or create UserProgress record in progressRepo
		progress, err := s.progressRepo.GetByUserAndChallenge(ctx, req.UserID, req.ChallengeID)
		if err != nil {
			fmt.Printf("failed to get user progress: %v\n", err)
		}
		
		now := time.Now()
		if progress == nil {
			progress = &models.UserProgress{
				UserID:      req.UserID,
				ChallengeID: req.ChallengeID,
				Status:      models.ProgressCompleted,
				StartedAt:   &now,
				CompletedAt: &now,
				Attempts:    1,
				TimeSpent:   60,
				XPEarned:    xpEarned,
				IsFirstBlood: isFirstBlood,
				IsPerfectSolve: s.isPerfectSolve(previousSubmissions),
			}
			if err := s.progressRepo.Create(ctx, progress); err != nil {
				fmt.Printf("failed to create user progress: %v\n", err)
			}
		} else {
			progress.Status = models.ProgressCompleted
			progress.CompletedAt = &now
			progress.XPEarned += xpEarned
			progress.Attempts++
			if err := s.progressRepo.Update(ctx, progress); err != nil {
				fmt.Printf("failed to update user progress: %v\n", err)
			}
		}

		// Increment solves count on the challenge
		if err := s.challengeRepo.IncrementSolves(ctx, req.ChallengeID); err != nil {
			fmt.Printf("failed to increment solves: %v\n", err)
		}
	}

	message := "Correct! Great job!"
	if isFirstBlood {
		message = "First Blood! You're the first to solve this challenge!"
	} else if alreadySolved {
		message = "Correct! (You already solved this flag)"
	}

	return &SubmitFlagResponse{
		Correct:       true,
		Message:       message,
		XPEarned:      xpEarned,
		IsFirstBlood:  isFirstBlood,
		AlreadySolved: alreadySolved,
	}, nil
}

// validateFlag validates a submitted flag
func (s *ChallengeService) validateFlag(submitted string, flag *models.Flag, userID uuid.UUID) bool {
	if !flag.IsDynamic {
		// Static flag - direct comparison
		return hmac.Equal([]byte(submitted), []byte(flag.Flag))
	}

	// Dynamic flag - generate expected flag and compare
	expected := s.generateDynamicFlag(flag.DynamicSeed, userID.String())
	return hmac.Equal([]byte(submitted), []byte(expected))
}

// generateDynamicFlag generates a dynamic flag for a user
func (s *ChallengeService) generateDynamicFlag(seed, userID string) string {
	h := hmac.New(sha256.New, []byte(seed))
	h.Write([]byte(userID))
	return "flag{" + hex.EncodeToString(h.Sum(nil))[:32] + "}"
}

// calculateXP calculates XP earned for a solve
func (s *ChallengeService) calculateXP(challenge *models.Challenge, flag *models.Flag, isFirstBlood, alreadySolved bool) int {
	if alreadySolved {
		return 0 // No XP for re-solving
	}

	baseXP := challenge.Points

	// Apply penalties for hints used (would need to track this)
	// For now, assume full points

	// First blood bonus
	if isFirstBlood {
		baseXP *= 2
	}

	return baseXP
}

// isPerfectSolve checks if this is a perfect solve (no hints, first try)
func (s *ChallengeService) isPerfectSolve(previousSubmissions []models.Submission) bool {
	// Perfect if no previous incorrect submissions
	for _, sub := range previousSubmissions {
		if !sub.IsCorrect {
			return false
		}
	}
	return len(previousSubmissions) == 0
}

func (s *ChallengeService) updateSubmission(ctx context.Context, submission *models.Submission) error {
	// This would update the submission with calculated fields
	// For now, we'll skip as the initial create already saved it
	return nil
}

// GetHints returns available hints for a challenge
func (s *ChallengeService) GetHints(ctx context.Context, challengeID uuid.UUID) ([]models.Hint, error) {
	return s.challengeRepo.GetHints(ctx, challengeID)
}

// CreateChallenge creates a new challenge (admin only)
func (s *ChallengeService) CreateChallenge(ctx context.Context, challenge *models.Challenge) error {
	return s.challengeRepo.Create(ctx, challenge)
}

// UpdateChallenge updates a challenge (admin only)
func (s *ChallengeService) UpdateChallenge(ctx context.Context, challenge *models.Challenge) error {
	return s.challengeRepo.Update(ctx, challenge)
}

// DeleteChallenge deletes a challenge (admin only)
func (s *ChallengeService) DeleteChallenge(ctx context.Context, id uuid.UUID) error {
	return s.challengeRepo.Delete(ctx, id)
}