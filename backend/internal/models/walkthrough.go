package models

import (
	"time"

	"github.com/google/uuid"
)

// Walkthrough represents an interactive tutorial
type Walkthrough struct {
	ID              uuid.UUID      `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	Title           string         `json:"title" gorm:"not null;size:200"`
	Slug            string         `json:"slug" gorm:"uniqueIndex;not null;size:200"`
	Description     string         `json:"description" gorm:"type:text"`
	ShortDescription string        `json:"short_description" gorm:"size:500"`
	Difficulty      string         `json:"difficulty" gorm:"size:20"`
	CategoryID      uuid.UUID      `json:"category_id"`
	AuthorID        uuid.UUID      `json:"author_id"`
	
	// Content
	Steps           []WalkthroughStep `json:"steps,omitempty" gorm:"foreignKey:WalkthroughID;order:order"`
	TotalSteps      int               `json:"total_steps" gorm:"default:0"`
	EstimatedTime   int               `json:"estimated_time" gorm:"default:30"` // minutes
	
	// Prerequisites
	Prerequisites   []WalkthroughPrerequisite `json:"prerequisites,omitempty" gorm:"foreignKey:WalkthroughID"`
	SkillsLearned   []string          `json:"skills_learned" gorm:"type:text[]"`
	
	// Media
	ThumbnailURL    string         `json:"thumbnail_url" gorm:"size:500"`
	VideoURL        string         `json:"video_url" gorm:"size:500"`
	
	// Stats
	CompletionCount int            `json:"completion_count" gorm:"default:0"`
	Rating          float64        `json:"rating" gorm:"default:0"`
	RatingCount     int            `json:"rating_count" gorm:"default:0"`
	
	// Status
	IsPublished     bool           `json:"is_published" gorm:"default:false"`
	IsActive        bool           `json:"is_active" gorm:"default:true"`
	PublishedAt     *time.Time     `json:"published_at"`
	
	// Linked challenge (optional)
	ChallengeID     *uuid.UUID     `json:"challenge_id"`
	
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	
	// Relationships
	Category        Category       `json:"category,omitempty" gorm:"foreignKey:CategoryID"`
	Author          User           `json:"author,omitempty" gorm:"foreignKey:AuthorID"`
}

// WalkthroughStep represents a step in a walkthrough
type WalkthroughStep struct {
	ID              uuid.UUID      `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	WalkthroughID   uuid.UUID      `json:"walkthrough_id" gorm:"not null;index"`
	Order           int            `json:"order" gorm:"not null"`
	Type            StepType       `json:"type" gorm:"not null"`
	Title           string         `json:"title" gorm:"not null;size:200"`
	Content         string         `json:"content" gorm:"type:text"`
	
	// Step configuration
	Config          StepConfig     `json:"config" gorm:"embedded;embeddedPrefix:config_"`
	
	// Validation
	ValidationType  ValidationType `json:"validation_type" gorm:"size:50"`
	ValidationData  map[string]interface{} `json:"validation_data" gorm:"type:jsonb"`
	
	// Hints
	Hints           []StepHint     `json:"hints,omitempty" gorm:"foreignKey:StepID"`
	
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
}

// StepType represents the type of walkthrough step
type StepType string

const (
	StepTypeTheory      StepType = "theory"
	StepTypeLabSetup    StepType = "lab_setup"
	StepTypeInteractive StepType = "interactive"
	StepTypeHandsOn     StepType = "hands_on"
	StepTypeQuiz        StepType = "quiz"
	StepTypeChallenge   StepType = "challenge"
	StepTypeVideo       StepType = "video"
	StepTypeCodeReview  StepType = "code_review"
)

// StepConfig represents step-specific configuration
type StepConfig struct {
	// For lab_setup
	LabImage        string            `json:"lab_image,omitempty" gorm:"size:255"`
	LabPorts        []int             `json:"lab_ports,omitempty" gorm:"type:integer[]"`
	LabEnvVars      map[string]string `json:"lab_env_vars,omitempty" gorm:"type:jsonb"`
	
	// For hands_on
	ShowTerminal    bool              `json:"show_terminal" gorm:"default:false"`
	ShowEditor      bool              `json:"show_editor" gorm:"default:false"`
	EditorLanguage  string            `json:"editor_language,omitempty" gorm:"size:50"`
	EditorTemplate  string            `json:"editor_template,omitempty" gorm:"type:text"`
	ShowBrowser     bool              `json:"show_browser" gorm:"default:false"`
	
	// For quiz
	Questions       []QuizQuestion    `json:"questions,omitempty" gorm:"type:jsonb"`
	
	// For code_review
	CodeFiles       []CodeFile        `json:"code_files,omitempty" gorm:"type:jsonb"`
	
	// General
	AllowSkip       bool              `json:"allow_skip" gorm:"default:false"`
	AutoAdvance     bool              `json:"auto_advance" gorm:"default:false"`
}

// QuizQuestion represents a quiz question
type QuizQuestion struct {
	ID              string   `json:"id"`
	Question        string   `json:"question"`
	Type            string   `json:"type"` // multiple_choice, true_false, fill_blank
	Options         []string `json:"options,omitempty"`
	CorrectAnswer   interface{} `json:"correct_answer"`
	Explanation     string   `json:"explanation"`
	Points          int      `json:"points"`
}

// CodeFile represents a file in code review
type CodeFile struct {
	Filename        string `json:"filename"`
	Language        string `json:"language"`
	Content         string `json:"content"`
	HighlightLines  []int  `json:"highlight_lines,omitempty"`
	IsVulnerable    bool   `json:"is_vulnerable"`
}

// StepHint represents a hint for a step
type StepHint struct {
	ID          uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	StepID      uuid.UUID `json:"step_id" gorm:"not null;index"`
	Level       int       `json:"level" gorm:"not null"`
	Content     string    `json:"content" gorm:"type:text;not null"`
	Penalty     int       `json:"penalty" gorm:"default:0"`
	Order       int       `json:"order" gorm:"default:0"`
}

// ValidationType represents the type of validation
type ValidationType string

const (
	ValidationTypeNone        ValidationType = "none"
	ValidationTypeHTTPRequest ValidationType = "http_request"
	ValidationTypeCommand     ValidationType = "command"
	ValidationTypeFile        ValidationType = "file"
	ValidationTypeQuiz        ValidationType = "quiz"
	ValidationTypeFlag        ValidationType = "flag"
	ValidationTypeCode        ValidationType = "code"
	ValidationTypeSAST        ValidationType = "sast"
	ValidationTypeDAST        ValidationType = "dast"
	ValidationTypeManual      ValidationType = "manual"
)

// WalkthroughPrerequisite represents walkthrough prerequisites
type WalkthroughPrerequisite struct {
	ID               uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	WalkthroughID    uuid.UUID `json:"walkthrough_id" gorm:"not null;index"`
	PrerequisiteID   uuid.UUID `json:"prerequisite_id" gorm:"not null;index"`
	IsRequired       bool      `json:"is_required" gorm:"default:true"`
}

// UserWalkthroughProgress represents a user's progress in a walkthrough
type UserWalkthroughProgress struct {
	ID              uuid.UUID      `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	UserID          uuid.UUID      `json:"user_id" gorm:"not null;index"`
	WalkthroughID   uuid.UUID      `json:"walkthrough_id" gorm:"not null;index"`
	Status          ProgressStatus `json:"status" gorm:"default:'not_started'"`
	CurrentStepID   *uuid.UUID     `json:"current_step_id"`
	CompletedSteps  []uuid.UUID    `json:"completed_steps" gorm:"type:uuid[]"`
	StepData        map[string]interface{} `json:"step_data" gorm:"type:jsonb"`
	StartedAt       *time.Time     `json:"started_at"`
	CompletedAt     *time.Time     `json:"completed_at"`
	TotalTime       int            `json:"total_time" gorm:"default:0"` // seconds
	HintsUsed       int            `json:"hints_used" gorm:"default:0"`
	XPEarned        int            `json:"xp_earned" gorm:"default:0"`
	PerfectRun      bool           `json:"perfect_run" gorm:"default:false"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	
	// Relationships
	User            User           `json:"-" gorm:"foreignKey:UserID"`
	Walkthrough     Walkthrough    `json:"walkthrough,omitempty" gorm:"foreignKey:WalkthroughID"`
	CurrentStep     *WalkthroughStep `json:"current_step,omitempty" gorm:"foreignKey:CurrentStepID"`
}

// UserWalkthroughStepProgress represents progress on a specific step
type UserWalkthroughStepProgress struct {
	ID              uuid.UUID  `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	UserID          uuid.UUID  `json:"user_id" gorm:"not null;index"`
	StepID          uuid.UUID  `json:"step_id" gorm:"not null;index"`
	WalkthroughID   uuid.UUID  `json:"walkthrough_id" gorm:"not null;index"`
	Status          StepProgressStatus `json:"status" gorm:"default:'not_started'"`
	StartedAt       *time.Time `json:"started_at"`
	CompletedAt     *time.Time `json:"completed_at"`
	Attempts        int        `json:"attempts" gorm:"default:0"`
	HintsUsed       []int      `json:"hints_used" gorm:"type:integer[]"`
	ValidationData  map[string]interface{} `json:"validation_data" gorm:"type:jsonb"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

// StepProgressStatus represents the status of a step
type StepProgressStatus string

const (
	StepProgressNotStarted StepProgressStatus = "not_started"
	StepProgressInProgress StepProgressStatus = "in_progress"
	StepProgressCompleted  StepProgressStatus = "completed"
	StepProgressSkipped    StepProgressStatus = "skipped"
	StepProgressFailed     StepProgressStatus = "failed"
)