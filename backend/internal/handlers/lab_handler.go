package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"tygrsec-academy-platform/internal/services"
)

// LabHandler handles lab HTTP requests
type LabHandler struct {
	labService *services.LabService
}

// NewLabHandler creates a new LabHandler
func NewLabHandler(labService *services.LabService) *LabHandler {
	return &LabHandler{labService: labService}
}

// CreateLab handles creating a new lab
func (h *LabHandler) CreateLab(c *gin.Context) {
	var req services.CreateLabRequest
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
	req.UserID = userID.(uuid.UUID)

	lab, err := h.labService.CreateLab(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, lab)
}

// GetLab handles getting a lab by ID
func (h *LabHandler) GetLab(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid lab ID"})
		return
	}

	lab, err := h.labService.GetLab(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if lab == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Lab not found"})
		return
	}

	c.JSON(http.StatusOK, lab)
}

// DestroyLab handles destroying a lab
func (h *LabHandler) DestroyLab(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid lab ID"})
		return
	}

	if err := h.labService.DestroyLab(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Lab destroyed"})
}

// GetTerminalSession handles creating a terminal session
func (h *LabHandler) GetTerminalSession(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid lab ID"})
		return
	}

	sessionID, err := h.labService.GetTerminalSession(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"session_id": sessionID})
}