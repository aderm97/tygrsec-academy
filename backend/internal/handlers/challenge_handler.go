package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"tygrsec-academy-platform/internal/models"
	"tygrsec-academy-platform/internal/services"
)

// ChallengeHandler handles challenge HTTP requests
type ChallengeHandler struct {
	challengeService *services.ChallengeService
}

// NewChallengeHandler creates a new ChallengeHandler
func NewChallengeHandler(challengeService *services.ChallengeService) *ChallengeHandler {
	return &ChallengeHandler{challengeService: challengeService}
}

// ListChallenges handles listing challenges
func (h *ChallengeHandler) ListChallenges(c *gin.Context) {
	var filter models.ChallengeFilter
	
	// Parse query parameters
	if categories := c.QueryArray("category"); len(categories) > 0 {
		filter.Categories = categories
	}
	if difficulties := c.QueryArray("difficulty"); len(difficulties) > 0 {
		filter.Difficulties = difficulties
	}
	if types := c.QueryArray("type"); len(types) > 0 {
		filter.Types = types
	}
	filter.Search = c.Query("search")
	filter.SortBy = c.DefaultQuery("sort_by", "created_at")
	filter.SortOrder = c.DefaultQuery("sort_order", "desc")
	
	// Parse pagination
	page := 1
	pageSize := 20
	if p := c.Query("page"); p != "" {
		// Parse int safely
	}
	filter.Page = page
	filter.PageSize = pageSize

	challenges, total, err := h.challengeService.ListChallenges(c.Request.Context(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  challenges,
		"total": total,
		"page":  page,
		"size":  pageSize,
	})
}

// GetChallenge handles getting a single challenge
func (h *ChallengeHandler) GetChallenge(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid challenge ID"})
		return
	}

	challenge, err := h.challengeService.GetChallenge(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if challenge == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Challenge not found"})
		return
	}

	c.JSON(http.StatusOK, challenge)
}

// SubmitFlag handles flag submission
func (h *ChallengeHandler) SubmitFlag(c *gin.Context) {
	challengeID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid challenge ID"})
		return
	}

	var req struct {
		Flag string `json:"flag" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user ID from context
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	submitReq := services.SubmitFlagRequest{
		UserID:      userID.(uuid.UUID),
		ChallengeID: challengeID,
		Flag:        req.Flag,
		IP:          c.ClientIP(),
		UserAgent:   c.Request.UserAgent(),
	}

	result, err := h.challengeService.SubmitFlag(c.Request.Context(), submitReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

// GetHints handles getting hints for a challenge
func (h *ChallengeHandler) GetHints(c *gin.Context) {
	challengeID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid challenge ID"})
		return
	}

	hints, err := h.challengeService.GetHints(c.Request.Context(), challengeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"hints": hints})
}

// GetChallengeBySlug handles getting a single challenge by slug
func (h *ChallengeHandler) GetChallengeBySlug(c *gin.Context) {
	slug := c.Param("slug")
	challenge, err := h.challengeService.GetChallengeBySlug(c.Request.Context(), slug)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if challenge == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Challenge not found"})
		return
	}

	c.JSON(http.StatusOK, challenge)
}

// StartChallenge handles starting a challenge lab
func (h *ChallengeHandler) StartChallenge(c *gin.Context) {
	// TODO: Implement lab start
	c.JSON(http.StatusNotImplemented, gin.H{"error": "Not implemented"})
}

// CreateChallenge handles creating a new challenge (admin only)
func (h *ChallengeHandler) CreateChallenge(c *gin.Context) {
	var challenge models.Challenge
	if err := c.ShouldBindJSON(&challenge); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.challengeService.CreateChallenge(c.Request.Context(), &challenge); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, challenge)
}

// UpdateChallenge handles updating a challenge (admin only)
func (h *ChallengeHandler) UpdateChallenge(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid challenge ID"})
		return
	}

	challenge, err := h.challengeService.GetChallenge(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if challenge == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Challenge not found"})
		return
	}

	if err := c.ShouldBindJSON(challenge); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.challengeService.UpdateChallenge(c.Request.Context(), challenge); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, challenge)
}

// DeleteChallenge handles deleting a challenge (admin only)
func (h *ChallengeHandler) DeleteChallenge(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid challenge ID"})
		return
	}

	if err := h.challengeService.DeleteChallenge(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Challenge deleted"})
}