package models

import (
	"time"

	"github.com/google/uuid"
)

// Badge represents an achievement badge
type Badge struct {
	ID              uuid.UUID    `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	Name            string       `json:"name" gorm:"uniqueIndex;not null;size:100"`
	Slug            string       `json:"slug" gorm:"uniqueIndex;not null;size:100"`
	Description     string       `json:"description" gorm:"type:text"`
	Icon            string       `json:"icon" gorm:"not null;size:100"`
	Color           string       `json:"color" gorm:"size:7"` // Hex color
	Rarity          BadgeRarity  `json:"rarity" gorm:"default:'common'"`
	Category        string       `json:"category" gorm:"size:50"`
	XPReward        int          `json:"xp_reward" gorm:"default:0"`
	
	// Requirements for earning
	RequirementType BadgeRequirementType `json:"requirement_type"`
	RequirementValue int               `json:"requirement_value"`
	RequirementData  map[string]interface{} `json:"requirement_data" gorm:"serializer:json"`
	
	// Stats
	TimesEarned     int          `json:"times_earned" gorm:"default:0"`
	IsActive        bool         `json:"is_active" gorm:"default:true"`
	IsSecret        bool         `json:"is_secret" gorm:"default:false"` // Hidden until earned
	IsEvent         bool         `json:"is_event" gorm:"default:false"`   // Limited time
	EventStartAt    *time.Time   `json:"event_start_at"`
	EventEndAt      *time.Time   `json:"event_end_at"`
	
	CreatedAt       time.Time    `json:"created_at"`
	UpdatedAt       time.Time    `json:"updated_at"`
}

// BadgeRarity represents badge rarity levels
type BadgeRarity string

const (
	RarityCommon     BadgeRarity = "common"
	RarityUncommon   BadgeRarity = "uncommon"
	RarityRare       BadgeRarity = "rare"
	RarityEpic       BadgeRarity = "epic"
	RarityLegendary  BadgeRarity = "legendary"
	RarityEvent      BadgeRarity = "event"
)

// BadgeRequirementType represents the type of requirement
type BadgeRequirementType string

const (
	BadgeReqChallengesSolved   BadgeRequirementType = "challenges_solved"
	BadgeReqCategoryCompleted  BadgeRequirementType = "category_completed"
	BadgeReqDifficultyMastered BadgeRequirementType = "difficulty_mastered"
	BadgeReqFirstBlood         BadgeRequirementType = "first_blood"
	BadgeReqStreak             BadgeRequirementType = "streak"
	BadgeReqPerfectSolves      BadgeRequirementType = "perfect_solves"
	BadgeReqLevel              BadgeRequirementType = "level"
	BadgeReqXP                 BadgeRequirementType = "xp"
	BadgeReqSpecificChallenge  BadgeRequirementType = "specific_challenge"
	BadgeReqHintsAvoided       BadgeRequirementType = "hints_avoided"
	BadgeReqTimeSpent          BadgeRequirementType = "time_spent"
	BadgeReqCustom             BadgeRequirementType = "custom"
)

// PredefinedBadges returns a list of default badges
func PredefinedBadges() []Badge {
	return []Badge{
		// Beginner Badges
		{
			Name:            "First Steps",
			Slug:            "first-steps",
			Description:     "Complete your first challenge",
			Icon:            "🌱",
			Color:           "#00D4AA",
			Rarity:          RarityCommon,
			Category:        "beginner",
			XPReward:        50,
			RequirementType: BadgeReqChallengesSolved,
			RequirementValue: 1,
		},
		{
			Name:            "Hello World",
			Slug:            "hello-world",
			Description:     "Submit your first correct flag",
			Icon:            "👋",
			Color:           "#74B9FF",
			Rarity:          RarityCommon,
			Category:        "beginner",
			XPReward:        25,
			RequirementType: BadgeReqChallengesSolved,
			RequirementValue: 1,
		},
		{
			Name:            "Speed Demon",
			Slug:            "speed-demon",
			Description:     "Complete a challenge in under 5 minutes",
			Icon:            "⚡",
			Color:           "#FDCB6E",
			Rarity:          RarityCommon,
			Category:        "beginner",
			XPReward:        100,
			RequirementType: BadgeReqCustom,
			RequirementValue: 1,
		},
		
		// Skill Badges - SQL Injection
		{
			Name:            "SQLi Novice",
			Slug:            "sqli-novice",
			Description:     "Solve 5 SQL injection challenges",
			Icon:            "💉",
			Color:           "#FF6B6B",
			Rarity:          RarityUncommon,
			Category:        "skills",
			XPReward:        250,
			RequirementType: BadgeReqCategoryCompleted,
			RequirementValue: 5,
			RequirementData: map[string]interface{}{"category": "sql-injection"},
		},
		{
			Name:            "SQLi Master",
			Slug:            "sqli-master",
			Description:     "Solve all SQL injection challenges",
			Icon:            "💉",
			Color:           "#6C5CE7",
			Rarity:          RarityRare,
			Category:        "skills",
			XPReward:        1000,
			RequirementType: BadgeReqCategoryCompleted,
			RequirementValue: 0, // All in category
			RequirementData: map[string]interface{}{"category": "sql-injection"},
		},
		
		// Skill Badges - XSS
		{
			Name:            "XSS Hunter",
			Slug:            "xss-hunter",
			Description:     "Solve 5 XSS challenges",
			Icon:            "🎯",
			Color:           "#FF6B6B",
			Rarity:          RarityUncommon,
			Category:        "skills",
			XPReward:        250,
			RequirementType: BadgeReqCategoryCompleted,
			RequirementValue: 5,
			RequirementData: map[string]interface{}{"category": "xss"},
		},
		
		// Mastery Badges
		{
			Name:            "Injection Master",
			Slug:            "injection-master",
			Description:     "Complete all Injection challenges",
			Icon:            "🏆",
			Color:           "#FFD700",
			Rarity:          RarityEpic,
			Category:        "mastery",
			XPReward:        2000,
			RequirementType: BadgeReqCategoryCompleted,
			RequirementValue: 0,
			RequirementData: map[string]interface{}{"category": "injection"},
		},
		{
			Name:            "Web Warrior",
			Slug:            "web-warrior",
			Description:     "Complete all Web Security challenges",
			Icon:            "🌐",
			Color:           "#00D4AA",
			Rarity:          RarityEpic,
			Category:        "mastery",
			XPReward:        2000,
			RequirementType: BadgeReqCategoryCompleted,
			RequirementValue: 0,
			RequirementData: map[string]interface{}{"category": "web-security"},
		},
		
		// Special Badges
		{
			Name:            "First Blood",
			Slug:            "first-blood",
			Description:     "Be the first to solve a challenge",
			Icon:            "🩸",
			Color:           "#FF0000",
			Rarity:          RarityRare,
			Category:        "special",
			XPReward:        500,
			RequirementType: BadgeReqFirstBlood,
			RequirementValue: 1,
		},
		{
			Name:            "Perfectionist",
			Slug:            "perfectionist",
			Description:     "Complete 10 challenges without hints",
			Icon:            "⭐",
			Color:           "#FFD700",
			Rarity:          RarityEpic,
			Category:        "special",
			XPReward:        1000,
			RequirementType: BadgeReqPerfectSolves,
			RequirementValue: 10,
		},
		{
			Name:            "Speed Runner",
			Slug:            "speed-runner",
			Description:     "Complete 10 challenges under 50% of estimated time",
			Icon:            "🏃",
			Color:           "#FDCB6E",
			Rarity:          RarityEpic,
			Category:        "special",
			XPReward:        1000,
			RequirementType: BadgeReqCustom,
			RequirementValue: 10,
		},
		
		// Streak Badges
		{
			Name:            "Week Warrior",
			Slug:            "week-warrior",
			Description:     "Maintain a 7-day solving streak",
			Icon:            "📅",
			Color:           "#00D4AA",
			Rarity:          RarityRare,
			Category:        "streak",
			XPReward:        500,
			RequirementType: BadgeReqStreak,
			RequirementValue: 7,
		},
		{
			Name:            "Monthly Master",
			Slug:            "monthly-master",
			Description:     "Maintain a 30-day solving streak",
			Icon:            "📆",
			Color:           "#6C5CE7",
			Rarity:          RarityEpic,
			Category:        "streak",
			XPReward:        2000,
			RequirementType: BadgeReqStreak,
			RequirementValue: 30,
		},
		{
			Name:            "Century Club",
			Slug:            "century-club",
			Description:     "Maintain a 100-day solving streak",
			Icon:            "💯",
			Color:           "#FFD700",
			Rarity:          RarityLegendary,
			Category:        "streak",
			XPReward:        10000,
			RequirementType: BadgeReqStreak,
			RequirementValue: 100,
		},
		
		// Level Badges
		{
			Name:            "Hacker",
			Slug:            "hacker",
			Description:     "Reach level 3",
			Icon:            "👨‍💻",
			Color:           "#00D4AA",
			Rarity:          RarityUncommon,
			Category:        "progression",
			XPReward:        200,
			RequirementType: BadgeReqLevel,
			RequirementValue: 3,
		},
		{
			Name:            "Elite Hacker",
			Slug:            "elite-hacker",
			Description:     "Reach level 8",
			Icon:            "👑",
			Color:           "#FFD700",
			Rarity:          RarityLegendary,
			Category:        "progression",
			XPReward:        5000,
			RequirementType: BadgeReqLevel,
			RequirementValue: 8,
		},
	}
}

// IsAvailable checks if a badge is currently available
func (b *Badge) IsAvailable() bool {
	if !b.IsActive {
		return false
	}
	
	if !b.IsEvent {
		return true
	}
	
	now := time.Now()
	if b.EventStartAt != nil && now.Before(*b.EventStartAt) {
		return false
	}
	if b.EventEndAt != nil && now.After(*b.EventEndAt) {
		return false
	}
	
	return true
}