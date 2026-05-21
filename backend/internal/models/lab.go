package models

import (
	"time"

	"github.com/google/uuid"
)

// Lab represents a running lab instance
type Lab struct {
	ID            uuid.UUID  `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	UserID        uuid.UUID  `json:"user_id" gorm:"not null;index"`
	ChallengeID   uuid.UUID  `json:"challenge_id" gorm:"not null;index"`
	
	// Container info
	ContainerID   string     `json:"container_id" gorm:"size:100"`
	ContainerName string     `json:"container_name" gorm:"size:100"`
	Image         string     `json:"image" gorm:"not null;size:255"`
	Status        LabStatus  `json:"status" gorm:"default:'creating'"`
	
	// Network
	IPAddress     string     `json:"ip_address" gorm:"size:45"`
	Ports         []LabPort  `json:"ports,omitempty" gorm:"foreignKey:LabID"`
	URL           string     `json:"url" gorm:"size:500"`
	
	// Resources
	MemoryLimit   int64      `json:"memory_limit"` // bytes
	CPULimit      float64    `json:"cpu_limit"`    // percentage
	
	// Lifecycle
	StartedAt     time.Time  `json:"started_at"`
	ExpiresAt     time.Time  `json:"expires_at"`
	LastAccessed  time.Time  `json:"last_accessed"`
	TerminatedAt  *time.Time `json:"terminated_at"`
	TerminationReason string `json:"termination_reason" gorm:"size:100"`
	
	// Flags
	DynamicFlag   string     `json:"-" gorm:"size:255"`
	
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
	
	// Relationships
	User          User       `json:"-" gorm:"foreignKey:UserID"`
	Challenge     Challenge  `json:"challenge,omitempty" gorm:"foreignKey:ChallengeID"`
}

// LabStatus represents the status of a lab
type LabStatus string

const (
	LabStatusCreating   LabStatus = "creating"
	LabStatusRunning    LabStatus = "running"
	LabStatusPaused     LabStatus = "paused"
	LabStatusStopping   LabStatus = "stopping"
	LabStatusStopped    LabStatus = "stopped"
	LabStatusError      LabStatus = "error"
	LabStatusExpired    LabStatus = "expired"
	LabStatusDestroyed  LabStatus = "destroyed"
)

// LabPort represents a port mapping for a lab
type LabPort struct {
	ID          uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	LabID       uuid.UUID `json:"lab_id" gorm:"not null;index"`
	ContainerPort int     `json:"container_port"`
	HostPort    int       `json:"host_port"`
	Protocol    string    `json:"protocol" gorm:"default:'tcp'"`
	ServiceName string    `json:"service_name" gorm:"size:100"`
	URL         string    `json:"url" gorm:"size:500"`
	IsPublished bool      `json:"is_published" gorm:"default:true"`
}

// LabSession represents a terminal session for a lab
type LabSession struct {
	ID          uuid.UUID  `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	LabID       uuid.UUID  `json:"lab_id" gorm:"not null;index"`
	UserID      uuid.UUID  `json:"user_id" gorm:"not null;index"`
	SessionID   string     `json:"session_id" gorm:"uniqueIndex;not null;size:100"`
	Status      SessionStatus `json:"status" gorm:"default:'active'"`
	StartedAt   time.Time  `json:"started_at"`
	LastActivity time.Time `json:"last_activity"`
	EndedAt     *time.Time `json:"ended_at"`
}

// SessionStatus represents the status of a session
type SessionStatus string

const (
	SessionStatusActive    SessionStatus = "active"
	SessionStatusIdle      SessionStatus = "idle"
	SessionStatusClosed    SessionStatus = "closed"
	SessionStatusExpired   SessionStatus = "expired"
)

// LabCreateRequest represents a request to create a lab
type LabCreateRequest struct {
	ChallengeID uuid.UUID         `json:"challenge_id" binding:"required"`
	EnvVars     map[string]string `json:"env_vars,omitempty"`
}

// LabResponse represents a lab response
type LabResponse struct {
	ID           uuid.UUID    `json:"id"`
	ChallengeID  uuid.UUID    `json:"challenge_id"`
	Status       LabStatus    `json:"status"`
	URL          string       `json:"url,omitempty"`
	Ports        []PortMapping `json:"ports,omitempty"`
	ExpiresAt    time.Time    `json:"expires_at"`
	TimeRemaining int         `json:"time_remaining_seconds"`
}

// PortMapping represents a port mapping response
type PortMapping struct {
	ContainerPort int    `json:"container_port"`
	HostPort      int    `json:"host_port"`
	Protocol      string `json:"protocol"`
	ServiceName   string `json:"service_name,omitempty"`
	URL           string `json:"url,omitempty"`
}

// IsActive returns true if the lab is currently active
func (l *Lab) IsActive() bool {
	return l.Status == LabStatusRunning || l.Status == LabStatusCreating
}

// IsExpired returns true if the lab has expired
func (l *Lab) IsExpired() bool {
	return time.Now().After(l.ExpiresAt)
}

// TimeRemaining returns the remaining time in seconds
func (l *Lab) TimeRemaining() int {
	if l.IsExpired() {
		return 0
	}
	return int(l.ExpiresAt.Sub(time.Now()).Seconds())
}

// Extend extends the lab expiration time
func (l *Lab) Extend(duration time.Duration) {
	l.ExpiresAt = l.ExpiresAt.Add(duration)
}