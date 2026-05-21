package services

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"

	"tygrsec-academy-platform/internal/config"
	"tygrsec-academy-platform/internal/models"
	"tygrsec-academy-platform/internal/repository"
)

// LabService handles lab lifecycle management
type LabService struct {
	labRepo repository.LabRepository
	config  config.DockerConfig
	docker  interface{}
}

// NewLabService creates a new LabService
func NewLabService(labRepo repository.LabRepository, config config.DockerConfig) *LabService {
	return &LabService{
		labRepo: labRepo,
		config:  config,
		docker:  nil,
	}
}

// CreateLabRequest represents a lab creation request
type CreateLabRequest struct {
	UserID      uuid.UUID
	ChallengeID uuid.UUID
	Image       string
	Ports       []int
	EnvVars     map[string]string
	MemoryLimit int64
	CPULimit    float64
	TTL         time.Duration
}

// CreateLab creates a new lab instance
func (s *LabService) CreateLab(ctx context.Context, req CreateLabRequest) (*models.Lab, error) {
	// Check if user already has an active lab for this challenge
	existingLab, err := s.labRepo.GetByUserAndChallenge(ctx, req.UserID, req.ChallengeID)
	if err != nil {
		return nil, fmt.Errorf("failed to check existing lab: %w", err)
	}

	if existingLab != nil {
		// Return existing lab if it's still active
		if existingLab.IsActive() {
			return existingLab, nil
		}
	}

	// Generate container name
	containerName := fmt.Sprintf("tygrsec-academy-lab-%s-%s", req.UserID.String()[:8], generateRandomID(8))

	// Set defaults
	if req.TTL == 0 {
		req.TTL = time.Duration(s.config.DefaultTTL) * time.Minute
	}

	// Create lab record
	lab := &models.Lab{
		UserID:        req.UserID,
		ChallengeID:   req.ChallengeID,
		ContainerName: containerName,
		Image:         req.Image,
		Status:        models.LabStatusCreating,
		MemoryLimit:   req.MemoryLimit,
		CPULimit:      req.CPULimit,
		StartedAt:     time.Now(),
		ExpiresAt:     time.Now().Add(req.TTL),
	}

	if err := s.labRepo.Create(ctx, lab); err != nil {
		return nil, fmt.Errorf("failed to create lab record: %w", err)
	}

	// Start Docker container in background
	go s.startContainer(lab, req)

	return lab, nil
}

// startContainer starts the Docker container for a lab
func (s *LabService) startContainer(lab *models.Lab, req CreateLabRequest) {
	ctx := context.Background()
	time.Sleep(1 * time.Second)

	// Simulate running container
	lab.Status = models.LabStatusRunning
	lab.IPAddress = "127.0.0.1"
	lab.ContainerID = "dummy-container-id"
	
	// Add mock port bindings
	// Protocol is TCP, HostPort matches the first requested port
	if len(req.Ports) > 0 {
		// Dummy mapping
		lab.IPAddress = "127.0.0.1"
	}

	if err := s.labRepo.Update(ctx, lab); err != nil {
		fmt.Printf("Failed to update lab status: %v\n", err)
	}
}

// updateLabStatus updates the status of a lab
func (s *LabService) updateLabStatus(ctx context.Context, labID uuid.UUID, status models.LabStatus, reason string) {
	lab, err := s.labRepo.GetByID(ctx, labID)
	if err != nil {
		fmt.Printf("Failed to get lab for status update: %v\n", err)
		return
	}

	lab.Status = status
	if reason != "" {
		lab.TerminationReason = reason
	}

	if err := s.labRepo.Update(ctx, lab); err != nil {
		fmt.Printf("Failed to update lab status: %v\n", err)
	}
}

// GetLab returns a lab by ID
func (s *LabService) GetLab(ctx context.Context, labID uuid.UUID) (*models.Lab, error) {
	lab, err := s.labRepo.GetByID(ctx, labID)
	if err != nil {
		return nil, err
	}

	if lab == nil {
		return nil, errors.New("lab not found")
	}

	// Check if expired
	if lab.IsExpired() && lab.Status == models.LabStatusRunning {
		lab.Status = models.LabStatusExpired
		if err := s.labRepo.Update(ctx, lab); err != nil {
			return nil, err
		}

		// Stop container
		go s.destroyContainer(lab)
	}

	return lab, nil
}

// DestroyLab destroys a lab instance
func (s *LabService) DestroyLab(ctx context.Context, labID uuid.UUID) error {
	lab, err := s.labRepo.GetByID(ctx, labID)
	if err != nil {
		return err
	}

	if lab == nil {
		return errors.New("lab not found")
	}

	// Stop container
	go s.destroyContainer(lab)

	// Update status
	lab.Status = models.LabStatusDestroyed
	lab.TerminatedAt = func() *time.Time { t := time.Now(); return &t }()
	return s.labRepo.Update(ctx, lab)
}

// destroyContainer stops and removes a Docker container
func (s *LabService) destroyContainer(lab *models.Lab) {
	// Dummy stub
}

// GetTerminalSession creates a terminal session for a lab
func (s *LabService) GetTerminalSession(ctx context.Context, labID uuid.UUID) (string, error) {
	lab, err := s.GetLab(ctx, labID)
	if err != nil {
		return "", err
	}

	if !lab.IsActive() {
		return "", errors.New("lab is not running")
	}

	// Generate session ID
	sessionID := generateRandomID(32)

	// TODO: Store session in Redis

	return sessionID, nil
}

// CleanupExpiredLabs stops and removes expired labs
func (s *LabService) CleanupExpiredLabs(ctx context.Context) error {
	labs, err := s.labRepo.GetExpiredLabs(ctx)
	if err != nil {
		return err
	}

	for _, lab := range labs {
		go s.destroyContainer(&lab)

		lab.Status = models.LabStatusExpired
		lab.TerminatedAt = func() *time.Time { t := time.Now(); return &t }()
		if err := s.labRepo.Update(ctx, &lab); err != nil {
			fmt.Printf("Failed to update expired lab: %v\n", err)
		}
	}

	return nil
}

// generateFlag generates a random flag
func (s *LabService) generateFlag(seed string) string {
	bytes := make([]byte, 16)
	rand.Read(bytes)
	return fmt.Sprintf("flag{%s}", hex.EncodeToString(bytes))
}

// generateRandomID generates a random ID string
func generateRandomID(length int) string {
	bytes := make([]byte, length/2)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}