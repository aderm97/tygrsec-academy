package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"tygrsec-academy-platform/internal/models"
	"tygrsec-academy-platform/internal/services"
)

// UserHandler handles user HTTP requests
type UserHandler struct {
	userRepo            services.UserRepository
	gamificationService *services.GamificationService
}

// NewUserHandler creates a new UserHandler
func NewUserHandler(userRepo services.UserRepository, gamificationService *services.GamificationService) *UserHandler {
	return &UserHandler{
		userRepo:            userRepo,
		gamificationService: gamificationService,
	}
}

// GetCurrentUser returns the current authenticated user
func (h *UserHandler) GetCurrentUser(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userID, ok := userIDVal.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID"})
		return
	}

	user, err := h.userRepo.GetByID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if user == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, user)
}

// UpdateProfile handles profile updates
func (h *UserHandler) UpdateProfile(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userID, ok := userIDVal.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID"})
		return
	}

	user, err := h.userRepo.GetByID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if user == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// TODO: Implement profile update logic
	c.JSON(http.StatusNotImplemented, gin.H{"error": "Not implemented"})
}

// GetStats returns user statistics
func (h *UserHandler) GetStats(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userID, ok := userIDVal.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID"})
		return
	}

	stats, err := h.gamificationService.GetUserStats(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// GetProgress returns user progress
func (h *UserHandler) GetProgress(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userID, ok := userIDVal.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID"})
		return
	}

	progressList, err := h.gamificationService.GetUserProgress(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	type ChallengeProgressResponse struct {
		ChallengeID  string `json:"challenge_id"`
		Status       string `json:"status"` // "unsolved" | "attempted" | "solved"
		SolvedAt     string `json:"solved_at,omitempty"`
		Attempts     int    `json:"attempts"`
		PointsEarned int    `json:"points_earned"`
	}

	var resp []ChallengeProgressResponse
	for _, p := range progressList {
		status := "unsolved"
		if p.Status == "completed" {
			status = "solved"
		} else if p.Status == "in_progress" {
			status = "attempted"
		}

		solvedAt := ""
		if p.CompletedAt != nil {
			solvedAt = p.CompletedAt.Format(time.RFC3339)
		}

		resp = append(resp, ChallengeProgressResponse{
			ChallengeID:  p.ChallengeID.String(),
			Status:       status,
			SolvedAt:     solvedAt,
			Attempts:     p.Attempts,
			PointsEarned: p.XPEarned,
		})
	}

	c.JSON(http.StatusOK, resp)
}


// SavePathwayProgress saves progress on learning pathway steps and awards XP dynamically
func (h *UserHandler) SavePathwayProgress(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userID, ok := userIDVal.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID"})
		return
	}

	var req struct {
		PathwayID string `json:"pathwayId" binding:"required"`
		StepIndex int    `json:"stepIndex"`
		TimeSpent int    `json:"timeSpent"`
		XPEarned  int    `json:"xpEarned"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Default XP if not provided
	xpToAward := req.XPEarned
	if xpToAward <= 0 {
		xpToAward = 10
	}

	// Award the XP using gamificationService
	if err := h.gamificationService.AwardXP(c.Request.Context(), userID, xpToAward); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Save the pathway progress record persistently in PostgreSQL
	progress := models.UserPathwayProgress{
		UserID:      userID,
		PathwayID:   req.PathwayID,
		StepIndex:   req.StepIndex,
		TimeSpent:   req.TimeSpent,
		XPEarned:    xpToAward,
		CompletedAt: time.Now(),
	}
	if err := h.userRepo.SavePathwayProgress(c.Request.Context(), &progress); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save pathway progress: " + err.Error()})
		return
	}

	// Trigger badge check after earning points
	h.gamificationService.CheckAndAwardBadges(c.Request.Context(), userID)

	// Fetch updated user to return fresh stats
	user, err := h.userRepo.GetByID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":    "success",
		"xp_earned": xpToAward,
		"user":      user,
	})
}

// GetPathwayProgress returns the learning pathway completion records for the authenticated user
func (h *UserHandler) GetPathwayProgress(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userID, ok := userIDVal.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID"})
		return
	}

	list, err := h.userRepo.GetPathwayProgress(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, list)
}

// GetBadges returns user badges

func (h *UserHandler) GetBadges(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userID, ok := userIDVal.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID"})
		return
	}

	badges, err := h.gamificationService.GetUserBadges(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"badges": badges})
}

// GetLeaderboard returns the global leaderboard
func (h *UserHandler) GetLeaderboard(c *gin.Context) {
	users, err := h.userRepo.List(c.Request.Context(), 0, 100)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	type LeaderboardEntry struct {
		Rank     int    `json:"rank"`
		Username string `json:"username"`
		Level    int    `json:"level"`
		XP       int    `json:"xp"`
		Solved   int    `json:"solved"`
		Streak   int    `json:"streak"`
	}

	var resp []LeaderboardEntry
	for i, u := range users {
		resp = append(resp, LeaderboardEntry{
			Rank:     i + 1,
			Username: u.Username,
			Level:    u.Level,
			XP:       u.XP,
			Solved:   u.ChallengesSolved,
			Streak:   u.CurrentStreak,
		})
	}

	c.JSON(http.StatusOK, resp)
}

// GetCategoryLeaderboard returns a category-specific leaderboard
func (h *UserHandler) GetCategoryLeaderboard(c *gin.Context) {
	h.GetLeaderboard(c)
}