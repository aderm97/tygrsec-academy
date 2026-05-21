package database

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"

	"tygrsec-academy-platform/internal/config"
)

// RedisClient wraps go-redis client
type RedisClient struct {
	client *redis.Client
}

// NewRedisClient creates a new Redis client
func NewRedisClient(cfg config.RedisConfig) (*RedisClient, error) {
	client := redis.NewClient(&redis.Options{
		Addr:     cfg.RedisAddr(),
		Password: cfg.Password,
		DB:       cfg.DB,
		PoolSize: 100,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("failed to connect to Redis: %w", err)
	}

	return &RedisClient{client: client}, nil
}

// Close closes the Redis connection
func (r *RedisClient) Close() error {
	return r.client.Close()
}

// Get gets a value from Redis
func (r *RedisClient) Get(ctx context.Context, key string) (string, error) {
	return r.client.Get(ctx, key).Result()
}

// Set sets a value in Redis with expiration
func (r *RedisClient) Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error {
	return r.client.Set(ctx, key, value, expiration).Err()
}

// Delete deletes a key from Redis
func (r *RedisClient) Delete(ctx context.Context, keys ...string) error {
	return r.client.Del(ctx, keys...).Err()
}

// Exists checks if a key exists
func (r *RedisClient) Exists(ctx context.Context, keys ...string) (int64, error) {
	return r.client.Exists(ctx, keys...).Result()
}

// Expire sets expiration on a key
func (r *RedisClient) Expire(ctx context.Context, key string, expiration time.Duration) error {
	return r.client.Expire(ctx, key, expiration).Err()
}

// HGet gets a field from a hash
func (r *RedisClient) HGet(ctx context.Context, key, field string) (string, error) {
	return r.client.HGet(ctx, key, field).Result()
}

// HSet sets a field in a hash
func (r *RedisClient) HSet(ctx context.Context, key string, values ...interface{}) error {
	return r.client.HSet(ctx, key, values...).Err()
}

// HGetAll gets all fields from a hash
func (r *RedisClient) HGetAll(ctx context.Context, key string) (map[string]string, error) {
	return r.client.HGetAll(ctx, key).Result()
}

// Incr increments a key
func (r *RedisClient) Incr(ctx context.Context, key string) (int64, error) {
	return r.client.Incr(ctx, key).Result()
}

// Decr decrements a key
func (r *RedisClient) Decr(ctx context.Context, key string) (int64, error) {
	return r.client.Decr(ctx, key).Result()
}

// LPush pushes to a list
func (r *RedisClient) LPush(ctx context.Context, key string, values ...interface{}) error {
	return r.client.LPush(ctx, key, values...).Err()
}

// LRange gets a range from a list
func (r *RedisClient) LRange(ctx context.Context, key string, start, stop int64) ([]string, error) {
	return r.client.LRange(ctx, key, start, stop).Result()
}

// Publish publishes a message to a channel
func (r *RedisClient) Publish(ctx context.Context, channel string, message interface{}) error {
	return r.client.Publish(ctx, channel, message).Err()
}

// Subscribe subscribes to channels
func (r *RedisClient) Subscribe(ctx context.Context, channels ...string) *redis.PubSub {
	return r.client.Subscribe(ctx, channels...)
}

// Session Store Methods

// StoreSession stores a user session
func (r *RedisClient) StoreSession(ctx context.Context, sessionID string, userID string, expiration time.Duration) error {
	key := fmt.Sprintf("session:%s", sessionID)
	return r.Set(ctx, key, userID, expiration)
}

// GetSession gets a user session
func (r *RedisClient) GetSession(ctx context.Context, sessionID string) (string, error) {
	key := fmt.Sprintf("session:%s", sessionID)
	return r.Get(ctx, key)
}

// DeleteSession deletes a user session
func (r *RedisClient) DeleteSession(ctx context.Context, sessionID string) error {
	key := fmt.Sprintf("session:%s", sessionID)
	return r.Delete(ctx, key)
}

// Rate Limiting Methods

// CheckRateLimit checks if a request is within rate limit
func (r *RedisClient) CheckRateLimit(ctx context.Context, key string, limit int, window time.Duration) (bool, int, error) {
	pipe := r.client.Pipeline()
	now := time.Now().Unix()
	windowStart := now - int64(window.Seconds())

	// Remove old entries
	pipe.ZRemRangeByScore(ctx, key, "0", fmt.Sprintf("%d", windowStart))

	// Count current entries
	countCmd := pipe.ZCard(ctx, key)

	// Add current request
	pipe.ZAdd(ctx, key, redis.Z{Score: float64(now), Member: now})

	// Set expiration
	pipe.Expire(ctx, key, window)

	_, err := pipe.Exec(ctx)
	if err != nil {
		return false, 0, err
	}

	count := int(countCmd.Val())
	return count <= limit, limit - count, nil
}

// Leaderboard Methods

// AddToLeaderboard adds a score to a leaderboard
func (r *RedisClient) AddToLeaderboard(ctx context.Context, leaderboard string, userID string, score float64) error {
	key := fmt.Sprintf("leaderboard:%s", leaderboard)
	return r.client.ZAdd(ctx, key, redis.Z{Score: score, Member: userID}).Err()
}

// GetLeaderboard gets the top N entries from a leaderboard
func (r *RedisClient) GetLeaderboard(ctx context.Context, leaderboard string, start, stop int64) ([]redis.Z, error) {
	key := fmt.Sprintf("leaderboard:%s", leaderboard)
	return r.client.ZRevRangeWithScores(ctx, key, start, stop).Result()
}

// GetUserRank gets a user's rank in a leaderboard
func (r *RedisClient) GetUserRank(ctx context.Context, leaderboard string, userID string) (int64, error) {
	key := fmt.Sprintf("leaderboard:%s", leaderboard)
	return r.client.ZRevRank(ctx, key, userID).Result()
}

// Cache Methods

// CacheChallenge caches challenge data
func (r *RedisClient) CacheChallenge(ctx context.Context, challengeID string, data string, expiration time.Duration) error {
	key := fmt.Sprintf("challenge:%s", challengeID)
	return r.Set(ctx, key, data, expiration)
}

// GetCachedChallenge gets cached challenge data
func (r *RedisClient) GetCachedChallenge(ctx context.Context, challengeID string) (string, error) {
	key := fmt.Sprintf("challenge:%s", challengeID)
	return r.Get(ctx, key)
}

// Lab Methods

// StoreLabState stores lab state
func (r *RedisClient) StoreLabState(ctx context.Context, labID string, state string, expiration time.Duration) error {
	key := fmt.Sprintf("lab:%s:state", labID)
	return r.Set(ctx, key, state, expiration)
}

// GetLabState gets lab state
func (r *RedisClient) GetLabState(ctx context.Context, labID string) (string, error) {
	key := fmt.Sprintf("lab:%s:state", labID)
	return r.Get(ctx, key)
}

// StoreTerminalSession stores a terminal session
func (r *RedisClient) StoreTerminalSession(ctx context.Context, sessionID string, labID string, expiration time.Duration) error {
	key := fmt.Sprintf("terminal:%s", sessionID)
	return r.Set(ctx, key, labID, expiration)
}

// GetTerminalSession gets a terminal session
func (r *RedisClient) GetTerminalSession(ctx context.Context, sessionID string) (string, error) {
	key := fmt.Sprintf("terminal:%s", sessionID)
	return r.Get(ctx, key)
}