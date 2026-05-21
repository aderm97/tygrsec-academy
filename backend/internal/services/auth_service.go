package services

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	"tygrsec-academy-platform/internal/config"
	"tygrsec-academy-platform/internal/models"
	"tygrsec-academy-platform/internal/repository"
)

// AuthService handles authentication logic
type AuthService struct {
	userRepo repository.UserRepository
	jwtConfig config.JWTConfig
}

// NewAuthService creates a new AuthService
func NewAuthService(userRepo repository.UserRepository, jwtConfig config.JWTConfig) *AuthService {
	return &AuthService{
		userRepo:  userRepo,
		jwtConfig: jwtConfig,
	}
}

// RegisterRequest represents a registration request
type RegisterRequest struct {
	Username string `json:"username" binding:"required,min=3,max=50"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

// LoginRequest represents a login request
type LoginRequest struct {
	UsernameOrEmail string `json:"username_or_email" binding:"required"`
	Password        string `json:"password" binding:"required"`
}

// AuthResponse represents an authentication response
type AuthResponse struct {
	User         models.User `json:"user"`
	AccessToken  string      `json:"access_token"`
	RefreshToken string      `json:"refresh_token"`
	ExpiresIn    int         `json:"expires_in"`
}

// TokenPair represents a pair of tokens
type TokenPair struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int    `json:"expires_in"`
}

// Register creates a new user account
func (s *AuthService) Register(ctx context.Context, req RegisterRequest) (*AuthResponse, error) {
	// Check if username exists
	existingUser, err := s.userRepo.GetByUsername(ctx, req.Username)
	if err != nil {
		return nil, fmt.Errorf("failed to check username: %w", err)
	}
	if existingUser != nil {
		return nil, errors.New("username already exists")
	}

	// Check if email exists
	existingUser, err = s.userRepo.GetByEmail(ctx, req.Email)
	if err != nil {
		return nil, fmt.Errorf("failed to check email: %w", err)
	}
	if existingUser != nil {
		return nil, errors.New("email already exists")
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// Create user
	user := &models.User{
		Username:     req.Username,
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
		DisplayName:  req.Username,
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	// Generate tokens
	tokens, err := s.generateTokenPair(user)
	if err != nil {
		return nil, fmt.Errorf("failed to generate tokens: %w", err)
	}

	return &AuthResponse{
		User:         *user,
		AccessToken:  tokens.AccessToken,
		RefreshToken: tokens.RefreshToken,
		ExpiresIn:    tokens.ExpiresIn,
	}, nil
}

// Login authenticates a user
func (s *AuthService) Login(ctx context.Context, req LoginRequest) (*AuthResponse, error) {
	// Find user by username or email
	var user *models.User
	var err error

	// Try username first
	user, err = s.userRepo.GetByUsername(ctx, req.UsernameOrEmail)
	if err != nil {
		return nil, fmt.Errorf("failed to find user: %w", err)
	}

	// If not found by username, try email
	if user == nil {
		user, err = s.userRepo.GetByEmail(ctx, req.UsernameOrEmail)
		if err != nil {
			return nil, fmt.Errorf("failed to find user: %w", err)
		}
	}

	if user == nil {
		return nil, errors.New("invalid credentials")
	}

	// Check if user is active
	if !user.IsActive {
		return nil, errors.New("account is deactivated")
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return nil, errors.New("invalid credentials")
	}

	// Generate tokens
	tokens, err := s.generateTokenPair(user)
	if err != nil {
		return nil, fmt.Errorf("failed to generate tokens: %w", err)
	}

	// Update last active
	now := time.Now()
	user.LastActiveAt = &now
	if err := s.userRepo.Update(ctx, user); err != nil {
		// Log error but don't fail login
		fmt.Printf("failed to update last active: %v\n", err)
	}

	return &AuthResponse{
		User:         *user,
		AccessToken:  tokens.AccessToken,
		RefreshToken: tokens.RefreshToken,
		ExpiresIn:    tokens.ExpiresIn,
	}, nil
}

// RefreshToken generates new tokens from a refresh token
func (s *AuthService) RefreshToken(ctx context.Context, refreshToken string) (*TokenPair, error) {
	// Parse refresh token
	token, err := jwt.Parse(refreshToken, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(s.jwtConfig.Secret), nil
	})

	if err != nil || !token.Valid {
		return nil, errors.New("invalid refresh token")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, errors.New("invalid token claims")
	}

	// Check token type
	if claims["type"] != "refresh" {
		return nil, errors.New("invalid token type")
	}

	// Get user
	userID, err := uuid.Parse(claims["sub"].(string))
	if err != nil {
		return nil, errors.New("invalid user ID in token")
	}

	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}
	if user == nil {
		return nil, errors.New("user not found")
	}

	// Generate new tokens
	return s.generateTokenPair(user)
}

// generateTokenPair generates access and refresh tokens
func (s *AuthService) generateTokenPair(user *models.User) (*TokenPair, error) {
	// Access token
	accessTokenExpiry := time.Now().Add(time.Duration(s.jwtConfig.AccessTokenTTL) * time.Minute)
	accessClaims := jwt.MapClaims{
		"sub":      user.ID.String(),
		"username": user.Username,
		"email":    user.Email,
		"admin":    user.IsAdmin,
		"type":     "access",
		"iat":      time.Now().Unix(),
		"exp":      accessTokenExpiry.Unix(),
	}
	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	accessTokenString, err := accessToken.SignedString([]byte(s.jwtConfig.Secret))
	if err != nil {
		return nil, fmt.Errorf("failed to sign access token: %w", err)
	}

	// Refresh token
	refreshTokenExpiry := time.Now().Add(time.Duration(s.jwtConfig.RefreshTokenTTL) * 24 * time.Hour)
	refreshClaims := jwt.MapClaims{
		"sub":  user.ID.String(),
		"type": "refresh",
		"iat":  time.Now().Unix(),
		"exp":  refreshTokenExpiry.Unix(),
	}
	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	refreshTokenString, err := refreshToken.SignedString([]byte(s.jwtConfig.Secret))
	if err != nil {
		return nil, fmt.Errorf("failed to sign refresh token: %w", err)
	}

	return &TokenPair{
		AccessToken:  accessTokenString,
		RefreshToken: refreshTokenString,
		ExpiresIn:    s.jwtConfig.AccessTokenTTL * 60,
	}, nil
}

// ForgotPassword initiates password reset
func (s *AuthService) ForgotPassword(ctx context.Context, email string) error {
	user, err := s.userRepo.GetByEmail(ctx, email)
	if err != nil {
		return fmt.Errorf("failed to find user: %w", err)
	}
	if user == nil {
		// Don't reveal if email exists
		return nil
	}

	// TODO: Generate reset token and send email
	// For now, just return nil
	return nil
}

// ResetPassword resets a user's password
func (s *AuthService) ResetPassword(ctx context.Context, token, newPassword string) error {
	// TODO: Validate reset token and update password
	return errors.New("not implemented")
}

// OAuthLogin handles OAuth login
func (s *AuthService) OAuthLogin(ctx context.Context, provider, oauthID, email, username string) (*AuthResponse, error) {
	// Try to find existing user by OAuth
	user, err := s.userRepo.GetByOAuth(ctx, provider, oauthID)
	if err != nil {
		return nil, fmt.Errorf("failed to find user: %w", err)
	}

	if user == nil {
		// Create new user
		user = &models.User{
			Username:       username,
			Email:          email,
			DisplayName:    username,
			OAuthProvider:  provider,
			OAuthID:        oauthID,
			IsEmailVerified: true,
		}

		if err := s.userRepo.Create(ctx, user); err != nil {
			return nil, fmt.Errorf("failed to create user: %w", err)
		}
	}

	// Generate tokens
	tokens, err := s.generateTokenPair(user)
	if err != nil {
		return nil, fmt.Errorf("failed to generate tokens: %w", err)
	}

	return &AuthResponse{
		User:         *user,
		AccessToken:  tokens.AccessToken,
		RefreshToken: tokens.RefreshToken,
		ExpiresIn:    tokens.ExpiresIn,
	}, nil
}