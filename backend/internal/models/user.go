package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// User represents a platform user
type User struct {
	ID                uuid.UUID      `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	Username          string         `json:"username" gorm:"uniqueIndex;not null;size:50"`
	Email             string         `json:"email" gorm:"uniqueIndex;not null;size:255"`
	PasswordHash      string         `json:"-" gorm:"not null"`
	DisplayName       string         `json:"display_name" gorm:"size:100"`
	AvatarURL         string         `json:"avatar_url" gorm:"size:500"`
	Bio               string         `json:"bio" gorm:"size:1000"`
	Location          string         `json:"location" gorm:"size:100"`
	Website           string         `json:"website" gorm:"size:255"`
	GitHubUsername    string         `json:"github_username" gorm:"size:50"`
	TwitterUsername   string         `json:"twitter_username" gorm:"size:50"`
	LinkedInURL       string         `json:"linkedin_url" gorm:"size:255"`
	
	// Gamification fields
	Level             int            `json:"level" gorm:"default:1"`
	XP                int            `json:"xp" gorm:"index;default:0"`
	Rank              int            `json:"rank" gorm:"default:0"`
	ChallengesSolved  int            `json:"challenges_solved" gorm:"default:0"`
	FirstBloods       int            `json:"first_bloods" gorm:"default:0"`
	CurrentStreak     int            `json:"current_streak" gorm:"default:0"`
	BestStreak        int            `json:"best_streak" gorm:"default:0"`
	LastActiveAt      *time.Time     `json:"last_active_at"`
	StreakUpdatedAt   *time.Time     `json:"streak_updated_at"`
	
	// Account status
	IsAdmin           bool           `json:"is_admin" gorm:"default:false"`
	IsPremium         bool           `json:"is_premium" gorm:"default:false"`
	IsEmailVerified   bool           `json:"is_email_verified" gorm:"default:false"`
	IsActive          bool           `json:"is_active" gorm:"default:true"`
	EmailVerifiedAt   *time.Time     `json:"email_verified_at"`
	
	// OAuth
	OAuthProvider     string         `json:"oauth_provider" gorm:"size:50"`
	OAuthID           string         `json:"oauth_id" gorm:"size:255"`
	
	// Timestamps
	CreatedAt         time.Time      `json:"created_at"`
	UpdatedAt         time.Time      `json:"updated_at"`
	DeletedAt         gorm.DeletedAt `json:"-" gorm:"index"`
	
	// Relationships
	Progress          []UserProgress `json:"progress,omitempty" gorm:"foreignKey:UserID"`
	Badges            []UserBadge    `json:"badges,omitempty" gorm:"foreignKey:UserID"`
	Submissions       []Submission   `json:"submissions,omitempty" gorm:"foreignKey:UserID"`
}

// BeforeCreate hook to generate UUID
func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}

// UserProgress tracks user progress on challenges
type UserProgress struct {
	ID              uuid.UUID      `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	UserID          uuid.UUID      `json:"user_id" gorm:"not null;index"`
	ChallengeID     uuid.UUID      `json:"challenge_id" gorm:"not null;index"`
	Status          ProgressStatus `json:"status" gorm:"default:'not_started'"`
	StartedAt       *time.Time     `json:"started_at"`
	CompletedAt     *time.Time     `json:"completed_at"`
	Attempts        int            `json:"attempts" gorm:"default:0"`
	HintsUsed       int            `json:"hints_used" gorm:"default:0"`
	TimeSpent       int            `json:"time_spent" gorm:"default:0"` // seconds
	XPEarned        int            `json:"xp_earned" gorm:"default:0"`
	IsFirstBlood    bool           `json:"is_first_blood" gorm:"default:false"`
	IsPerfectSolve  bool           `json:"is_perfect_solve" gorm:"default:false"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	
	// Relationships
	User        User        `json:"-" gorm:"foreignKey:UserID"`
	Challenge   Challenge   `json:"challenge,omitempty" gorm:"foreignKey:ChallengeID"`
}

// ProgressStatus represents the status of a user's progress
type ProgressStatus string

const (
	ProgressNotStarted ProgressStatus = "not_started"
	ProgressInProgress ProgressStatus = "in_progress"
	ProgressCompleted  ProgressStatus = "completed"
	ProgressAbandoned  ProgressStatus = "abandoned"
)

// UserBadge represents badges earned by users
type UserBadge struct {
	ID          uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	UserID      uuid.UUID `json:"user_id" gorm:"not null;index"`
	BadgeID     uuid.UUID `json:"badge_id" gorm:"not null;index"`
	EarnedAt    time.Time `json:"earned_at"`
	XPBonus     int       `json:"xp_bonus" gorm:"default:0"`
	
	// Relationships
	User        User      `json:"-" gorm:"foreignKey:UserID"`
	Badge       Badge     `json:"badge" gorm:"foreignKey:BadgeID"`
}

// UserStats represents aggregated user statistics
type UserStats struct {
	UserID               uuid.UUID `json:"user_id"`
	Username             string    `json:"username"`
	DisplayName          string    `json:"display_name"`
	AvatarURL            string    `json:"avatar_url"`
	Level                int       `json:"level"`
	XP                   int       `json:"xp"`
	Rank                 int       `json:"rank"`
	ChallengesSolved     int       `json:"challenges_solved"`
	ChallengesAttempted  int       `json:"challenges_attempted"`
	TotalSubmissions     int       `json:"total_submissions"`
	SuccessfulSubmissions int      `json:"successful_submissions"`
	FirstBloods          int       `json:"first_bloods"`
	CurrentStreak        int       `json:"current_streak"`
	BestStreak           int       `json:"best_streak"`
	AverageSolveTime     float64   `json:"average_solve_time"` // minutes
	CategoriesMastered   int       `json:"categories_mastered"`
	BadgesEarned         int       `json:"badges_earned"`
	MemberSince          time.Time `json:"member_since"`
}

// XPForLevel calculates the XP required for a given level
func XPForLevel(level int) int {
	if level <= 1 {
		return 0
	}
	// Exponential XP curve
	return int(1000 * (float64(level-1) * 1.5))
}

// LevelFromXP calculates the level based on total XP
func LevelFromXP(xp int) int {
	level := 1
	for {
		xpNeeded := XPForLevel(level + 1)
		if xp < xpNeeded {
			break
		}
		level++
	}
	return level
}

// LevelName returns the name for a given level
func LevelName(level int) string {
	names := map[int]string{
		1:  "Script Kiddie",
		2:  "Padawan",
		3:  "Hacker",
		4:  "Security Analyst",
		5:  "Penetration Tester",
		6:  "Security Engineer",
		7:  "Security Architect",
		8:  "Elite Hacker",
	}
	
	if name, ok := names[level]; ok {
		return name
	}
	return "Legend"
}

// UserPathwayProgress represents a user's progress on learning pathways/MCQ quizzes
type UserPathwayProgress struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	UserID      uuid.UUID `gorm:"type:uuid;not null;index;uniqueIndex:idx_user_pathway_step" json:"userId"`
	PathwayID   string    `gorm:"type:varchar(100);not null;index;uniqueIndex:idx_user_pathway_step" json:"pathwayId"`
	StepIndex   int       `gorm:"type:integer;not null;uniqueIndex:idx_user_pathway_step" json:"stepIndex"`
	TimeSpent   int       `gorm:"type:integer;default:0" json:"timeSpent"`
	XPEarned    int       `gorm:"type:integer;default:0" json:"xpEarned"`
	CompletedAt time.Time `gorm:"type:timestamp;not null" json:"completedAt"`
}