package database

import (
	"fmt"
	"log"
	"os"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"tygrsec-academy-platform/internal/config"
	"tygrsec-academy-platform/internal/models"
)

// NewPostgresDB creates a new PostgreSQL database connection
func NewPostgresDB(cfg config.DatabaseConfig) (*gorm.DB, error) {
	newLogger := logger.New(
		log.New(os.Stdout, "\r\n", log.LstdFlags),
		logger.Config{
			SlowThreshold:             time.Second,
			LogLevel:                  logger.Info,
			IgnoreRecordNotFoundError: true,
			Colorful:                  true,
		},
	)

	db, err := gorm.Open(postgres.Open(cfg.DSN()), &gorm.Config{
		Logger: newLogger,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	// Get underlying SQL DB for connection pool config
	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get underlying sql.DB: %w", err)
	}

	// Connection pool settings
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	return db, nil
}

// Migrate runs database migrations
func Migrate(db *gorm.DB) error {
	models := []interface{}{
		&models.User{},
		&models.UserProgress{},
		&models.UserBadge{},
		&models.Challenge{},
		&models.Flag{},
		&models.Hint{},
		&models.Attachment{},
		&models.LabEnvVar{},
		&models.Category{},
		&models.Tag{},
		&models.ChallengePrerequisite{},
		&models.Submission{},
		&models.Badge{},
		&models.Lab{},
		&models.LabPort{},
		&models.LabSession{},
		&models.Walkthrough{},
		&models.WalkthroughStep{},
		&models.StepHint{},
		&models.WalkthroughPrerequisite{},
		&models.UserWalkthroughProgress{},
		&models.UserWalkthroughStepProgress{},
		&models.UserPathwayProgress{},
	}

	if err := db.AutoMigrate(models...); err != nil {
		return fmt.Errorf("failed to migrate database: %w", err)
	}

	// Seed initial data
	if err := seedData(db); err != nil {
		return fmt.Errorf("failed to seed database: %w", err)
	}

	return nil
}

// seedData seeds initial database data
func seedData(db *gorm.DB) error {
	// Seed categories
	categories := []models.Category{
		{
			Name:        "SQL Injection",
			Slug:        "sql-injection",
			Description: "Learn to identify and exploit SQL injection vulnerabilities",
			Icon:        "💉",
			Color:       "#FF6B6B",
			Order:       1,
		},
		{
			Name:        "Cross-Site Scripting (XSS)",
			Slug:        "xss",
			Description: "Master the art of XSS attacks and defenses",
			Icon:        "🎯",
			Color:       "#FDCB6E",
			Order:       2,
		},
		{
			Name:        "Authentication",
			Slug:        "authentication",
			Description: "Explore authentication vulnerabilities and secure implementations",
			Icon:        "🔐",
			Color:       "#6C5CE7",
			Order:       3,
		},
		{
			Name:        "Access Control",
			Slug:        "access-control",
			Description: "Learn about IDOR, privilege escalation, and access control flaws",
			Icon:        "🛡️",
			Color:       "#00D4AA",
			Order:       4,
		},
		{
			Name:        "Command Injection",
			Slug:        "command-injection",
			Description: "Exploit and prevent command injection vulnerabilities",
			Icon:        "💻",
			Color:       "#FF6B6B",
			Order:       5,
		},
		{
			Name:        "Secure Coding",
			Slug:        "secure-coding",
			Description: "Write secure code and fix vulnerabilities",
			Icon:        "👨‍💻",
			Color:       "#74B9FF",
			Order:       6,
		},
		{
			Name:        "API Security",
			Slug:        "api-security",
			Description: "Secure your APIs against common vulnerabilities",
			Icon:        "🔌",
			Color:       "#00B894",
			Order:       7,
		},
		{
			Name:        "Cryptography",
			Slug:        "cryptography",
			Description: "Understand cryptographic failures and proper implementations",
			Icon:        "🔑",
			Color:       "#A29BFE",
			Order:       8,
		},
	}

	for _, category := range categories {
		var existing models.Category
		if err := db.Where("slug = ?", category.Slug).First(&existing).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				if err := db.Create(&category).Error; err != nil {
					return fmt.Errorf("failed to create category %s: %w", category.Name, err)
				}
			} else {
				return fmt.Errorf("failed to check category %s: %w", category.Name, err)
			}
		}
	}

	// Seed badges
	badges := models.PredefinedBadges()
	for _, badge := range badges {
		var existing models.Badge
		if err := db.Where("slug = ?", badge.Slug).First(&existing).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				if err := db.Create(&badge).Error; err != nil {
					return fmt.Errorf("failed to create badge %s: %w", badge.Name, err)
				}
			} else {
				return fmt.Errorf("failed to check badge %s: %w", badge.Name, err)
			}
		}
	}

	// Seed challenges and flags
	var sqlInjectionCategory models.Category
	if err := db.Where("slug = ?", "sql-injection").First(&sqlInjectionCategory).Error; err != nil {
		return fmt.Errorf("failed to find sql-injection category: %w", err)
	}

	var xssCategory models.Category
	if err := db.Where("slug = ?", "xss").First(&xssCategory).Error; err != nil {
		return fmt.Errorf("failed to find xss category: %w", err)
	}

	var secureCodingCategory models.Category
	if err := db.Where("slug = ?", "secure-coding").First(&secureCodingCategory).Error; err != nil {
		return fmt.Errorf("failed to find secure-coding category: %w", err)
	}

	challengeSeeds := []struct {
		Challenge models.Challenge
		Flags     []string
	}{
		{
			Challenge: models.Challenge{
				Title:            "SQL Injection 101",
				Slug:             "sqli-101",
				Description:      "Exploit a search form using raw string concatenation and verify Prepared Statement mitigations.",
				ShortDescription: "Learn to identify and mitigate basic SQL injection vulnerabilities.",
				Difficulty:      models.DifficultyBeginner,
				CategoryID:      sqlInjectionCategory.ID,
				Points:          400,
				BasePoints:      400,
				EstimatedTime:   30,
				Type:            models.ChallengeTypeLab,
				IsPublished:     true,
				IsActive:        true,
			},
			Flags: []string{
				"flag{sqli_vulnerable_bypass_success_200}",
				"flag{sqli_secure_prepared_statements_200}",
			},
		},
		{
			Challenge: models.Challenge{
				Title:            "XSS Discovery",
				Slug:             "xss-discovery",
				Description:      "Inject client-side payload scripts to trigger Reflected XSS and verify HTML escaping mitigations.",
				ShortDescription: "Understand reflected Cross-Site Scripting (XSS) attacks and defense strategies.",
				Difficulty:      models.DifficultyEasy,
				CategoryID:      xssCategory.ID,
				Points:          400,
				BasePoints:      400,
				EstimatedTime:   30,
				Type:            models.ChallengeTypeLab,
				IsPublished:     true,
				IsActive:        true,
			},
			Flags: []string{
				"flag{xss_vulnerable_reflected_exploit_200}",
				"flag{xss_secure_html_escaped_success_200}",
			},
		},
		{
			Challenge: models.Challenge{
				Title:            "Path Traversal",
				Slug:             "secure-input",
				Description:      "Bypass file path validation to read sensitive system files and verify safe basename mitigations.",
				ShortDescription: "Master directory traversal exploit pathways and secure resolution.",
				Difficulty:      models.DifficultyMedium,
				CategoryID:      secureCodingCategory.ID,
				Points:          400,
				BasePoints:      400,
				EstimatedTime:   45,
				Type:            models.ChallengeTypeLab,
				IsPublished:     true,
				IsActive:        true,
			},
			Flags: []string{
				"flag{path_traversal_vulnerable_disclose_200}",
				"flag{path_traversal_secure_basename_200}",
			},
		},
		{
			Challenge: models.Challenge{
				Title:            "Fintech Race Condition",
				Slug:             "fintech-bank",
				Description:      "Trigger an overdraft race condition in parallel transfer requests and verify Mutex locking mitigations.",
				ShortDescription: "Discover how concurrency issues yield extreme banking vulnerabilities.",
				Difficulty:      models.DifficultyHard,
				CategoryID:      secureCodingCategory.ID,
				Points:          400,
				BasePoints:      400,
				EstimatedTime:   60,
				Type:            models.ChallengeTypeLab,
				IsPublished:     true,
				IsActive:        true,
			},
			Flags: []string{
				"flag{race_condition_vulnerable_overdraft_200}",
				"flag{race_condition_secure_thread_locking_200}",
			},
		},
	}

	for _, seed := range challengeSeeds {
		var existing models.Challenge
		err := db.Where("slug = ?", seed.Challenge.Slug).First(&existing).Error
		if err != nil {
			if err == gorm.ErrRecordNotFound {
				// Create new challenge
				challenge := seed.Challenge
				if err := db.Create(&challenge).Error; err != nil {
					return fmt.Errorf("failed to create challenge %s: %w", challenge.Slug, err)
				}
				// Seed flags for this challenge
				for _, flagStr := range seed.Flags {
					flag := models.Flag{
						ChallengeID: challenge.ID,
						Flag:        flagStr,
						IsDynamic:   false,
					}
					if err := db.Create(&flag).Error; err != nil {
						return fmt.Errorf("failed to create flag for challenge %s: %w", challenge.Slug, err)
					}
				}
			} else {
				return fmt.Errorf("failed to check challenge %s: %w", seed.Challenge.Slug, err)
			}
		} else {
			// Update category ID and status if needed, and make sure flags exist
			existing.CategoryID = seed.Challenge.CategoryID
			existing.IsPublished = true
			existing.IsActive = true
			db.Save(&existing)

			for _, flagStr := range seed.Flags {
				var existingFlag models.Flag
				err := db.Where("challenge_id = ? AND flag = ?", existing.ID, flagStr).First(&existingFlag).Error
				if err != nil && err == gorm.ErrRecordNotFound {
					flag := models.Flag{
						ChallengeID: existing.ID,
						Flag:        flagStr,
						IsDynamic:   false,
					}
					if err := db.Create(&flag).Error; err != nil {
						return fmt.Errorf("failed to create flag for challenge %s: %w", existing.Slug, err)
					}
				}
			}
		}
	}

	if err := seedMockUsers(db); err != nil {
		return fmt.Errorf("failed to seed mock users: %w", err)
	}

	return nil
}

// seedMockUsers seeds 50 realistic mock participants to simulate a live, competitive CTF dashboard.
func seedMockUsers(db *gorm.DB) error {
	var count int64
	if err := db.Model(&models.User{}).Count(&count).Error; err != nil {
		return err
	}
	// If we already have seeded users, skip to avoid double insert overhead
	if count >= 10 {
		return nil
	}

	mockUsernames := []string{
		"cyber_ninja", "flag_hunter", "buffer_overflow", "stack_pointer", "byte_hacker",
		"security_pro", "zero_day", "binary_bandit", "packet_dropper", "kernel_panic",
		"root_shell", "crypt_keeper", "sql_injector", "xss_wizard", "csrf_master",
		"heap_handler", "shellcode_dev", "malware_analyst", "reverse_eng", "decompiled_guy",
		"noob_hacker", "payload_delivery", "red_teamer", "blue_defender", "soc_analyst",
		"cyber_sentinel", "firewall_bypass", "port_scanner", "nmap_guru", "wireshark_pro",
		"burp_suite_fan", "john_the_ripper", "hash_cat", "metasploit_user", "owasp_top10",
		"safe_coder", "secure_developer", "mutex_lock", "basename_check", "race_runner",
		"parallel_thread", "concurrency_guru", "auth_bypass", "idor_finder", "token_validation",
		"jwt_decoder", "crypto_fail", "aes_encryptor", "sha256_hash", "salt_pepper",
	}

	for i, username := range mockUsernames {
		email := username + "@tygrsec-academy-ctf.org"
		
		// Set realistic descending scores based on index
		xp := 8500 - (i * 165) // XP between 250 and 8500
		level := 1 + (xp / 1000)
		solved := 1 + (xp / 500)
		streak := (i % 6) + 1
		
		if solved > 18 {
			solved = 18
		}
		if level > 10 {
			level = 10
		}

		user := models.User{
			Username:         username,
			Email:            email,
			PasswordHash:     "$2a$10$7/O8NqLgE7Vb/t3B9o9WduN.t8H4W1yR9.3qUoI3p1L4b2T5D7a3q", // bcrypt for "Password123!"
			DisplayName:      username,
			Level:            level,
			XP:               xp,
			ChallengesSolved: solved,
			CurrentStreak:    streak,
			BestStreak:       streak + 2,
			IsActive:         true,
		}

		if err := db.Where("username = ?", username).FirstOrCreate(&user).Error; err != nil {
			return err
		}
	}
	return nil
}