package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Challenge represents a CTF challenge
type Challenge struct {
	ID                  uuid.UUID       `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	Title               string          `json:"title" gorm:"not null;size:200"`
	Slug                string          `json:"slug" gorm:"uniqueIndex;not null;size:200"`
	Description         string          `json:"description" gorm:"type:text"`
	ShortDescription    string          `json:"short_description" gorm:"size:500"`
	Difficulty          DifficultyLevel `json:"difficulty" gorm:"not null"`
	CategoryID          uuid.UUID       `json:"category_id" gorm:"not null;index"`
	Points              int             `json:"points" gorm:"not null"`
	BasePoints          int             `json:"base_points" gorm:"not null"` // Before multipliers
	EstimatedTime       int             `json:"estimated_time" gorm:"default:60"` // minutes
	AuthorID            *uuid.UUID      `json:"author_id" gorm:"index;default:null"`
	
	// Challenge type and setup
	Type                ChallengeType   `json:"type" gorm:"default:'standard'"`
	LabImage            string          `json:"lab_image" gorm:"size:255"`
	LabPorts            []int           `json:"lab_ports" gorm:"type:integer[]"`
	LabEnvVars          []LabEnvVar     `json:"lab_env_vars,omitempty" gorm:"foreignKey:ChallengeID"`
	Attachments         []Attachment    `json:"attachments,omitempty" gorm:"foreignKey:ChallengeID"`
	
	// Flags
	Flags               []Flag          `json:"-" gorm:"foreignKey:ChallengeID"`
	FlagFormat          string          `json:"flag_format" gorm:"size:100"`
	UsesDynamicFlag     bool            `json:"uses_dynamic_flag" gorm:"default:false"`
	
	// Hints
	Hints               []Hint          `json:"hints,omitempty" gorm:"foreignKey:ChallengeID"`
	
	// Walkthrough integration
	HasWalkthrough      bool            `json:"has_walkthrough" gorm:"default:false"`
	WalkthroughID       *uuid.UUID      `json:"walkthrough_id"`
	
	// SAST/DAST specific
	SourceCodeURL       string          `json:"source_code_url" gorm:"size:500"`
	TargetURL           string          `json:"target_url" gorm:"size:500"`
	ExpectedVulnerability string        `json:"expected_vulnerability" gorm:"size:100"`
	
	// Statistics
	SolvesCount         int             `json:"solves_count" gorm:"default:0"`
	AttemptsCount       int             `json:"attempts_count" gorm:"default:0"`
	FirstBloodAt        *time.Time      `json:"first_blood_at"`
	FirstBloodBy        *uuid.UUID      `json:"first_blood_by"`
	Rating              float64         `json:"rating" gorm:"default:0"`
	RatingCount         int             `json:"rating_count" gorm:"default:0"`
	
	// Status
	IsPublished         bool            `json:"is_published" gorm:"default:false"`
	IsActive            bool            `json:"is_active" gorm:"default:true"`
	PublishedAt         *time.Time      `json:"published_at"`
	
	// Prerequisites
	Prerequisites       []ChallengePrerequisite `json:"prerequisites,omitempty" gorm:"foreignKey:ChallengeID"`
	
	// Tags
	Tags                []Tag           `json:"tags,omitempty" gorm:"many2many:challenge_tags;"`
	
	// Timestamps
	CreatedAt           time.Time       `json:"created_at"`
	UpdatedAt           time.Time       `json:"updated_at"`
	DeletedAt           gorm.DeletedAt  `json:"-" gorm:"index"`
	
	// Relationships
	Category            Category        `json:"category,omitempty" gorm:"foreignKey:CategoryID"`
	Author              User            `json:"author,omitempty" gorm:"foreignKey:AuthorID"`
}

// BeforeCreate hook
func (c *Challenge) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}

// DifficultyLevel represents challenge difficulty
type DifficultyLevel string

const (
	DifficultyBeginner DifficultyLevel = "beginner"
	DifficultyEasy     DifficultyLevel = "easy"
	DifficultyMedium   DifficultyLevel = "medium"
	DifficultyHard     DifficultyLevel = "hard"
	DifficultyExpert   DifficultyLevel = "expert"
)

// ChallengeType represents the type of challenge
type ChallengeType string

const (
	ChallengeTypeStandard    ChallengeType = "standard"
	ChallengeTypeLab         ChallengeType = "lab"
	ChallengeTypeSAST        ChallengeType = "sast"
	ChallengeTypeDAST        ChallengeType = "dast"
	ChallengeTypeAgentic     ChallengeType = "agentic"
	ChallengeTypeWalkthrough ChallengeType = "walkthrough"
)

// Flag represents a challenge flag
type Flag struct {
	ID            uuid.UUID  `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	ChallengeID   uuid.UUID  `json:"challenge_id" gorm:"not null;index"`
	Flag          string     `json:"flag" gorm:"not null"`
	IsDynamic     bool       `json:"is_dynamic" gorm:"default:false"`
	DynamicSeed   string     `json:"dynamic_seed" gorm:"size:255"`
	PointsPenalty int        `json:"points_penalty" gorm:"default:0"`
	MaxUses       int        `json:"max_uses" gorm:"default:0"` // 0 = unlimited
	CurrentUses   int        `json:"current_uses" gorm:"default:0"`
	ExpiresAt     *time.Time `json:"expires_at"`
	CreatedAt     time.Time  `json:"created_at"`
}

// Hint represents a challenge hint
type Hint struct {
	ID          uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	ChallengeID uuid.UUID `json:"challenge_id" gorm:"not null;index"`
	Level       int       `json:"level" gorm:"not null"` // 1-4
	Content     string    `json:"content" gorm:"type:text;not null"`
	Penalty     int       `json:"penalty" gorm:"default:0"` // XP penalty percentage
	Order       int       `json:"order" gorm:"default:0"`
	IsActive    bool      `json:"is_active" gorm:"default:true"`
	CreatedAt   time.Time `json:"created_at"`
}

// Attachment represents a challenge attachment
type Attachment struct {
	ID           uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	ChallengeID  uuid.UUID `json:"challenge_id" gorm:"not null;index"`
	Filename     string    `json:"filename" gorm:"not null;size:255"`
	OriginalName string    `json:"original_name" gorm:"size:255"`
	FileSize     int64     `json:"file_size"`
	MIMEType     string    `json:"mime_type" gorm:"size:100"`
	URL          string    `json:"url" gorm:"size:500"`
	Description  string    `json:"description" gorm:"size:500"`
	DownloadCount int      `json:"download_count" gorm:"default:0"`
	CreatedAt    time.Time `json:"created_at"`
}

// LabEnvVar represents environment variables for lab challenges
type LabEnvVar struct {
	ID          uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	ChallengeID uuid.UUID `json:"challenge_id" gorm:"not null;index"`
	Key         string    `json:"key" gorm:"not null;size:100"`
	Value       string    `json:"value" gorm:"not null;size:500"`
	IsSecret    bool      `json:"is_secret" gorm:"default:false"`
}

// Category represents a challenge category
type Category struct {
	ID              uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	Name            string    `json:"name" gorm:"uniqueIndex;not null;size:100"`
	Slug            string    `json:"slug" gorm:"uniqueIndex;not null;size:100"`
	Description     string    `json:"description" gorm:"type:text"`
	Icon            string    `json:"icon" gorm:"size:50"`
	Color           string    `json:"color" gorm:"size:7"` // Hex color
	Order           int       `json:"order" gorm:"default:0"`
	ParentID        *uuid.UUID `json:"parent_id"`
	IsActive        bool      `json:"is_active" gorm:"default:true"`
	ChallengesCount int       `json:"challenges_count" gorm:"default:0"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
	
	// Relationships
	Parent   *Category   `json:"parent,omitempty" gorm:"foreignKey:ParentID"`
	Children []Category  `json:"children,omitempty" gorm:"foreignKey:ParentID"`
}

// Tag represents a challenge tag
type Tag struct {
	ID              uuid.UUID    `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	Name            string       `json:"name" gorm:"uniqueIndex;not null;size:50"`
	Slug            string       `json:"slug" gorm:"uniqueIndex;not null;size:50"`
	Description     string       `json:"description" gorm:"size:255"`
	Color           string       `json:"color" gorm:"size:7"`
	ChallengesCount int          `json:"challenges_count" gorm:"default:0"`
	CreatedAt       time.Time    `json:"created_at"`
	
	Challenges      []Challenge  `json:"challenges,omitempty" gorm:"many2many:challenge_tags;"`
}

// ChallengePrerequisite represents challenge prerequisites
type ChallengePrerequisite struct {
	ID              uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	ChallengeID     uuid.UUID `json:"challenge_id" gorm:"not null;index"`
	PrerequisiteID  uuid.UUID `json:"prerequisite_id" gorm:"not null;index"`
	CreatedAt       time.Time `json:"created_at"`
}

// Submission represents a flag submission
type Submission struct {
	ID            uuid.UUID  `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	UserID        uuid.UUID  `json:"user_id" gorm:"not null;index"`
	ChallengeID   uuid.UUID  `json:"challenge_id" gorm:"not null;index"`
	Flag          string     `json:"-" gorm:"not null"`
	IsCorrect     bool       `json:"is_correct" gorm:"not null"`
	IP            string     `json:"ip" gorm:"size:45"`
	UserAgent     string     `json:"user_agent" gorm:"size:500"`
	XPEarned      int        `json:"xp_earned" gorm:"default:0"`
	TimeSpent     int        `json:"time_spent" gorm:"default:0"` // seconds
	HintsUsed     int        `json:"hints_used" gorm:"default:0"`
	IsFirstBlood  bool       `json:"is_first_blood" gorm:"default:false"`
	IsPerfect     bool       `json:"is_perfect" gorm:"default:false"`
	SubmittedAt   time.Time  `json:"submitted_at"`
	
	// Relationships
	User        User       `json:"-" gorm:"foreignKey:UserID"`
	Challenge   Challenge  `json:"challenge,omitempty" gorm:"foreignKey:ChallengeID"`
}

// ChallengeFilter represents filters for listing challenges
type ChallengeFilter struct {
	Categories   []string
	Difficulties []string
	Types        []string
	Tags         []string
	Status       string // all, solved, unsolved, in_progress
	Search       string
	SortBy       string // newest, oldest, difficulty, points, solves
	SortOrder    string // asc, desc
	Page         int
	PageSize     int
}