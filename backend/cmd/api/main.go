package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"tygrsec-academy-platform/internal/config"
	"tygrsec-academy-platform/internal/handlers"
	"tygrsec-academy-platform/internal/middleware"
	"tygrsec-academy-platform/internal/repository"
	"tygrsec-academy-platform/internal/services"
	"tygrsec-academy-platform/pkg/database"
	"tygrsec-academy-platform/pkg/logger"
)

func main() {
	// Initialize logger
	log := logger.NewLogger()
	defer log.Sync()

	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatal("Failed to load configuration", zap.Error(err))
	}

	// Set Gin mode
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Initialize database
	db, err := database.NewPostgresDB(cfg.Database)
	if err != nil {
		log.Fatal("Failed to connect to database", zap.Error(err))
	}

	// Initialize Redis (optional - graceful degradation if Redis unavailable)
	redisClient, err := database.NewRedisClient(cfg.Redis)
	if err != nil {
		log.Warn("Redis unavailable - session/cache features degraded", zap.Error(err))
		redisClient = nil
	}
	if redisClient != nil {
		defer redisClient.Close()
	}

	// Run migrations
	if err := database.Migrate(db); err != nil {
		log.Fatal("Failed to run migrations", zap.Error(err))
	}

	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	challengeRepo := repository.NewChallengeRepository(db)
	submissionRepo := repository.NewSubmissionRepository(db)
	progressRepo := repository.NewProgressRepository(db)
	badgeRepo := repository.NewBadgeRepository(db)
	labRepo := repository.NewLabRepository(db)

	// Initialize services
	authService := services.NewAuthService(userRepo, cfg.JWT)
	challengeService := services.NewChallengeService(challengeRepo, submissionRepo, userRepo, progressRepo)
	gamificationService := services.NewGamificationService(progressRepo, badgeRepo, userRepo)
	labService := services.NewLabService(labRepo, cfg.Docker)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(authService)
	challengeHandler := handlers.NewChallengeHandler(challengeService)
	userHandler := handlers.NewUserHandler(userRepo, gamificationService)
	labHandler := handlers.NewLabHandler(labService)

	// Setup router
	router := gin.New()
	router.Use(gin.Recovery())
	router.Use(middleware.Logger(log))
	router.Use(middleware.ErrorHandler())

	// CORS configuration
	corsConfig := cors.Config{
		AllowOrigins:     cfg.CORS.AllowOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}
	router.Use(cors.New(corsConfig))

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":    "healthy",
			"version":   "1.0.0",
			"timestamp": time.Now().UTC(),
		})
	})

	// Public Lab Control
	router.POST("/api/v1/public/labs/control", func(c *gin.Context) {
		var req struct {
			Action    string `json:"action"`
			Challenge string `json:"challenge"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		containerName := ""
		switch req.Challenge {
		case "secure-input":
			containerName = "tygrsec-academy-secureinput"
		case "sqli-101":
			containerName = "tygrsec-academy-sqli"
		case "xss-discovery":
			containerName = "tygrsec-academy-xss"
		case "fintech-bank":
			containerName = "tygrsec-academy-fintech"
		default:
			c.JSON(http.StatusBadRequest, gin.H{"error": "unknown challenge"})
			return
		}

		var cmd *exec.Cmd
		if req.Action == "stop" {
			cmd = exec.Command("docker", "stop", containerName)
		} else if req.Action == "start" {
			cmd = exec.Command("docker", "start", containerName)
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": "unknown action"})
			return
		}

		if err := cmd.Run(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed to execute docker command: %v", err)})
			return
		}

		c.JSON(http.StatusOK, gin.H{"status": "success"})
	})

	// API routes
	api := router.Group("/api/v1")
	{
		// Public routes
		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.POST("/refresh", authHandler.RefreshToken)
			auth.POST("/forgot-password", authHandler.ForgotPassword)
			auth.POST("/reset-password", authHandler.ResetPassword)
			auth.GET("/oauth/github", authHandler.GitHubOAuth)
			auth.GET("/oauth/google", authHandler.GoogleOAuth)
		}

		// Protected routes
		authorized := api.Group("/")
		authorized.Use(middleware.JWTAuth(cfg.JWT.Secret))
		{
			// User routes
			authorized.GET("/users/me", userHandler.GetCurrentUser)
			authorized.PUT("/users/me", userHandler.UpdateProfile)
			authorized.GET("/users/me/stats", userHandler.GetStats)
			authorized.GET("/users/me/progress", userHandler.GetProgress)
			authorized.GET("/users/me/badges", userHandler.GetBadges)
			authorized.POST("/users/me/pathway-progress", userHandler.SavePathwayProgress)
			authorized.GET("/users/me/pathway-progress", userHandler.GetPathwayProgress)


			// Challenge routes
			challenges := authorized.Group("/challenges")
			{
				challenges.GET("", challengeHandler.ListChallenges)
				challenges.GET("/:id", challengeHandler.GetChallenge)
				challenges.GET("/slug/:slug", challengeHandler.GetChallengeBySlug)
				challenges.POST("/:id/submit", challengeHandler.SubmitFlag)
				challenges.GET("/:id/hints", challengeHandler.GetHints)
				challenges.POST("/:id/start", challengeHandler.StartChallenge)
			}

			// Lab routes
			labs := authorized.Group("/labs")
			{
				labs.POST("", labHandler.CreateLab)
				labs.GET("/:id", labHandler.GetLab)
				labs.DELETE("/:id", labHandler.DestroyLab)
				labs.POST("/:id/terminal", labHandler.GetTerminalSession)
			}

			// Leaderboard
			authorized.GET("/leaderboard", userHandler.GetLeaderboard)
			authorized.GET("/leaderboard/categories/:category", userHandler.GetCategoryLeaderboard)
		}

		// Admin routes
		admin := api.Group("/admin")
		admin.Use(middleware.JWTAuth(cfg.JWT.Secret))
		admin.Use(middleware.RequireAdmin())
		{
			admin.POST("/challenges", challengeHandler.CreateChallenge)
			admin.PUT("/challenges/:id", challengeHandler.UpdateChallenge)
			admin.DELETE("/challenges/:id", challengeHandler.DeleteChallenge)
		}
	}

	// Create HTTP server
	srv := &http.Server{
		Addr:         fmt.Sprintf(":%d", cfg.Server.Port),
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server in a goroutine
	go func() {
		log.Info("Starting server", zap.Int("port", cfg.Server.Port))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal("Failed to start server", zap.Error(err))
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Info("Shutting down server...")

	// Graceful shutdown with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown", zap.Error(err))
	}

	log.Info("Server exited")
}