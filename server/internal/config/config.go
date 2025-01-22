package config

import (
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/knadh/koanf/parsers/yaml"
	"github.com/knadh/koanf/providers/env"
	"github.com/knadh/koanf/providers/file"
	"github.com/knadh/koanf/v2"
	"github.com/pkg/errors"
	"github.com/rs/zerolog/log"
)

// AppConfig ...
type AppConfig struct {
	Server struct {
		Port                int `koanf:"port"`
		ReadTimeoutSeconds  int `koanf:"read_timeout_seconds"`
		WriteTimeoutSeconds int `koanf:"write_timeout_seconds"`
	} `koanf:"server"`

	Database struct {
		Host     string `koanf:"host"`
		Port     int    `koanf:"port"`
		User     string `koanf:"user"`
		Password string `koanf:"password"`
		DBName   string `koanf:"dbname"`
		SSLMode  string `koanf:"sslmode"`
	} `koanf:"database"`
}

func LoadConfig(baseFile, envName, envFile string) (*AppConfig, error) {
	k := koanf.New(".")

	if err := k.Load(file.Provider(baseFile), yaml.Parser()); err != nil {
		return nil, errors.Wrapf(err, "[LoadConfig] base config load failed (baseFile=%s)", baseFile)
	}

	if envName == "" {
		envName = "local"
	}
	envFilePath := fmt.Sprintf("./configs/config.%s.yaml", envName)
	if _, err := os.Stat(envFilePath); err == nil {
		if loadErr := k.Load(file.Provider(envFilePath), yaml.Parser()); loadErr != nil {
			return nil, errors.Wrapf(loadErr,
				"[LoadConfig] env-specific config load failed (env=%s, file=%s)",
				envName, envFilePath)
		}
		log.Debug().Msgf("[LoadConfig] Merged environment config: %s", envFilePath)
	} else {
		log.Debug().Msgf("[LoadConfig] No env config file found for env=%s (checked %s)", envName, envFilePath)
	}

	if envFile != "" {
		log.Debug().Msgf("[LoadConfig] Optionally read .env file at: %s (not implemented)", envFile)
	}

	if err := k.Load(env.Provider("APP_", ".", func(s string) string {
		return strings.Replace(strings.ToLower(strings.TrimPrefix(s, "APP_")), "_", ".", -1)
	}), nil); err != nil {
		return nil, errors.Wrap(err, "[LoadConfig] env.Provider load failed (prefix=APP_)")
	}

	var cfg AppConfig
	if err := k.Unmarshal("", &cfg); err != nil {
		return nil, errors.Wrap(err, "[LoadConfig] unmarshal to AppConfig failed")
	}

	log.Debug().Msgf("[LoadConfig] Final merged config: %#v", k.All())
	return &cfg, nil
}

type DBConfig struct {
	Host     string
	Port     int
	User     string
	Password string
	DBName   string
	SSLMode  string
}

func (c *AppConfig) ToDBConfig() DBConfig {
	return DBConfig{
		Host:     c.Database.Host,
		Port:     c.Database.Port,
		User:     c.Database.User,
		Password: c.Database.Password,
		DBName:   c.Database.DBName,
		SSLMode:  c.Database.SSLMode,
	}
}

func GetDBConnString(d DBConfig) string {
	return fmt.Sprintf("postgres://%s:%s@%s:%d/%s?sslmode=%s",
		d.User, d.Password, d.Host, d.Port, d.DBName, d.SSLMode,
	)
}

func NewServer(port int, readTimeout, writeTimeout time.Duration, handler http.Handler) *http.Server {
	return &http.Server{
		Addr:         fmt.Sprintf(":%d", port),
		Handler:      handler,
		ReadTimeout:  readTimeout,
		WriteTimeout: writeTimeout,
	}
}

func (c *AppConfig) ServerReadTimeout() time.Duration {
	return time.Duration(c.Server.ReadTimeoutSeconds) * time.Second
}
func (c *AppConfig) ServerWriteTimeout() time.Duration {
	return time.Duration(c.Server.WriteTimeoutSeconds) * time.Second
}
