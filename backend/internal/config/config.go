package config

import (
	"fmt"
	"strings"

	"github.com/spf13/viper"
)

// Config holds all application configuration
type Config struct {
	Environment string         `mapstructure:"environment"`
	Server      ServerConfig   `mapstructure:"server"`
	Database    DatabaseConfig `mapstructure:"database"`
	Redis       RedisConfig    `mapstructure:"redis"`
	JWT         JWTConfig      `mapstructure:"jwt"`
	Docker      DockerConfig   `mapstructure:"docker"`
	CORS        CORSConfig     `mapstructure:"cors"`
	OAuth       OAuthConfig    `mapstructure:"oauth"`
	Email       EmailConfig    `mapstructure:"email"`
	AI          AIConfig       `mapstructure:"ai"`
}

type ServerConfig struct {
	Port         int    `mapstructure:"port"`
	Host         string `mapstructure:"host"`
	ReadTimeout  int    `mapstructure:"read_timeout"`
	WriteTimeout int    `mapstructure:"write_timeout"`
}

type DatabaseConfig struct {
	Host     string `mapstructure:"host"`
	Port     int    `mapstructure:"port"`
	User     string `mapstructure:"user"`
	Password string `mapstructure:"password"`
	Name     string `mapstructure:"name"`
	SSLMode  string `mapstructure:"ssl_mode"`
}

type RedisConfig struct {
	Host     string `mapstructure:"host"`
	Port     int    `mapstructure:"port"`
	Password string `mapstructure:"password"`
	DB       int    `mapstructure:"db"`
}

type JWTConfig struct {
	Secret           string `mapstructure:"secret"`
	AccessTokenTTL   int    `mapstructure:"access_token_ttl"`   // minutes
	RefreshTokenTTL  int    `mapstructure:"refresh_token_ttl"`  // days
}

type DockerConfig struct {
	Host          string `mapstructure:"host"`
	Network       string `mapstructure:"network"`
	MaxContainers int    `mapstructure:"max_containers"`
	DefaultTTL    int    `mapstructure:"default_ttl"` // minutes
}

type CORSConfig struct {
	AllowOrigins []string `mapstructure:"allow_origins"`
}

type OAuthConfig struct {
	GitHubClientID     string `mapstructure:"github_client_id"`
	GitHubClientSecret string `mapstructure:"github_client_secret"`
	GoogleClientID     string `mapstructure:"google_client_id"`
	GoogleClientSecret string `mapstructure:"google_client_secret"`
}

type EmailConfig struct {
	SMTPHost     string `mapstructure:"smtp_host"`
	SMTPPort     int    `mapstructure:"smtp_port"`
	SMTPUser     string `mapstructure:"smtp_user"`
	SMTPPassword string `mapstructure:"smtp_password"`
	FromEmail    string `mapstructure:"from_email"`
}

type AIConfig struct {
	OpenAIKey      string `mapstructure:"openai_key"`
	AnthropicKey   string `mapstructure:"anthropic_key"`
	DefaultModel   string `mapstructure:"default_model"`
	MaxTokens      int    `mapstructure:"max_tokens"`
	Temperature    float64 `mapstructure:"temperature"`
}

// Load reads configuration from environment variables and config file
func Load() (*Config, error) {
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath(".")
	viper.AddConfigPath("./configs")
	viper.AddConfigPath("/etc/tygrsec-academy/")

	// Set defaults
	setDefaults()

	// Read from environment variables
	viper.SetEnvPrefix("SECURECODER")
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	viper.AutomaticEnv()

	// Read config file (optional)
	if err := viper.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			return nil, fmt.Errorf("error reading config file: %w", err)
		}
	}

	var config Config
	if err := viper.Unmarshal(&config); err != nil {
		return nil, fmt.Errorf("error unmarshaling config: %w", err)
	}

	// Validate configuration
	fmt.Printf("Loaded Config: %+v\n", config)
	fmt.Printf("JWT Secret from Viper directly: '%s'\n", viper.GetString("jwt.secret"))
	
	if config.JWT.Secret == "" {
		config.JWT.Secret = viper.GetString("jwt.secret")
	}

	if err := validate(&config); err != nil {
		return nil, fmt.Errorf("config validation failed: %w", err)
	}

	return &config, nil
}

func setDefaults() {
	// Server defaults
	viper.SetDefault("server.port", 8080)
	viper.SetDefault("server.host", "0.0.0.0")
	viper.SetDefault("server.read_timeout", 15)
	viper.SetDefault("server.write_timeout", 15)

	// Database defaults
	viper.SetDefault("database.host", "localhost")
	viper.SetDefault("database.port", 5432)
	viper.SetDefault("database.ssl_mode", "disable")
	viper.SetDefault("database.name", "tygrsec-academy")

	// Redis defaults
	viper.SetDefault("redis.host", "localhost")
	viper.SetDefault("redis.port", 6379)
	viper.SetDefault("redis.db", 0)

	// JWT defaults
	viper.SetDefault("jwt.access_token_ttl", 60)
	viper.SetDefault("jwt.refresh_token_ttl", 7)

	// Docker defaults
	viper.SetDefault("docker.host", "unix:///var/run/docker.sock")
	viper.SetDefault("docker.network", "tygrsec-academy-labs")
	viper.SetDefault("docker.max_containers", 100)
	viper.SetDefault("docker.default_ttl", 60)

	// CORS defaults
	viper.SetDefault("cors.allow_origins", []string{"http://localhost:3000"})

	// AI defaults
	viper.SetDefault("ai.default_model", "gpt-4")
	viper.SetDefault("ai.max_tokens", 2000)
	viper.SetDefault("ai.temperature", 0.7)
}

func validate(cfg *Config) error {
	if cfg.JWT.Secret == "" {
		return fmt.Errorf("JWT secret is required")
	}

	if cfg.Database.Password == "" {
		return fmt.Errorf("database password is required")
	}

	return nil
}

// DSN returns the PostgreSQL connection string
func (c *DatabaseConfig) DSN() string {
	return fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		c.Host, c.Port, c.User, c.Password, c.Name, c.SSLMode)
}

// RedisAddr returns the Redis connection address
func (c *RedisConfig) RedisAddr() string {
	return fmt.Sprintf("%s:%d", c.Host, c.Port)
}