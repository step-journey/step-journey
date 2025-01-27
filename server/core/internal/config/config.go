package config

import (
	"encoding/json"
	"fmt"
	"github.com/joho/godotenv"
	"net/http"
	"net/url"
	"os"
	"server/internal/flags"
	"time"

	"github.com/knadh/koanf/parsers/yaml"
	"github.com/knadh/koanf/providers/file"
	"github.com/knadh/koanf/v2"
	"github.com/pkg/errors"
	"github.com/rs/zerolog/log"
)

type AppConfig struct {
	Server struct {
		Port                int `koanf:"port"`
		ReadTimeoutSeconds  int `koanf:"read_timeout_seconds"`
		WriteTimeoutSeconds int `koanf:"write_timeout_seconds"`
	} `koanf:"server"`
}

type DBConfig struct {
	Host     string
	Port     int
	User     string
	Password string
	DBName   string
	SSLMode  string
}

func LoadConfig(baseFile, envName, envFile string) (*AppConfig, error) {
	k := koanf.New(".")

	if err := k.Load(file.Provider(baseFile), yaml.Parser()); err != nil {
		return nil, errors.Wrapf(err, "[LoadConfig] base config load failed (baseFile=%s)", baseFile)
	}

	// 기본 envName 없으면 "local"로
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
		log.Info().Msgf("[LoadConfig] Merged environment config: %s", envFilePath)
	} else {
		log.Error().Msgf("[LoadConfig] No env config file found for env=%s (checked %s)", envName, envFilePath)
	}

	// .env 파일 로드 (원한다면, envFile 인자 사용 가능)
	if envName == "local" {
		// local 환경이라면 .env 로부터 로드 (오류 무시)
		godotenv.Load(".env")
	}

	var cfg AppConfig
	if err := k.Unmarshal("", &cfg); err != nil {
		return nil, errors.Wrap(err, "[LoadConfig] unmarshal to AppConfig failed")
	}

	if rawAll := k.All(); rawAll != nil {
		// MarshalIndent 로 보기 좋은 JSON 문자열 만들기
		if configJSON, err := json.MarshalIndent(rawAll, "", "  "); err == nil {
			log.Info().Msgf("[LoadConfig] Final merged config:\n%s", string(configJSON))
		} else {
			log.Info().Msgf("[LoadConfig] Final merged config: %#v", rawAll)
		}
	}

	return &cfg, nil
}

func (c *AppConfig) ToDBConfig() (DBConfig, error) {
	var dbCfg DBConfig

	envName := os.Getenv(flags.EnvVarEnvironment)
	if envName == "" || envName == "local" {
		// local 환경
		dbCfg.User = "local_user"
		dbCfg.Password = "1234"
		dbCfg.DBName = "step_journey_local"
		dbCfg.Host = "localhost"
		dbCfg.Port = 5432
		dbCfg.SSLMode = "disable"
	} else {
		// ECS 환경 (Secrets Manager)

		// 1) username/password
		secretValue := os.Getenv(flags.EnvVarDbUserCredential)
		if secretValue == "" {
			return DBConfig{}, errors.Errorf("[ToDBConfig] missing env var: %s", flags.EnvVarDbUserCredential)
		}
		var secretData struct {
			Username string `json:"username"`
			Password string `json:"password"`
		}
		if err := json.Unmarshal([]byte(secretValue), &secretData); err != nil {
			return DBConfig{}, errors.Wrap(err, "[ToDBConfig] failed to parse DB_USER_CREDENTIAL JSON")
		}
		dbCfg.User = secretData.Username
		dbCfg.Password = secretData.Password

		// 2) host, port, dbname
		connectionInfoValue := os.Getenv(flags.EnvVarDbConnectionInfo)
		if connectionInfoValue == "" {
			return DBConfig{}, errors.Errorf("[ToDBConfig] missing env var: %s", flags.EnvVarDbConnectionInfo)
		}
		var connectionInfo struct {
			Host   string `json:"host"`
			Port   int    `json:"port"`
			DBName string `json:"dbname"`
		}
		if err := json.Unmarshal([]byte(connectionInfoValue), &connectionInfo); err != nil {
			return DBConfig{}, errors.Wrap(err, "[ToDBConfig] failed to parse DB_CONNECTION_INFO JSON")
		}
		dbCfg.Host = connectionInfo.Host
		dbCfg.Port = connectionInfo.Port
		dbCfg.DBName = connectionInfo.DBName

		dbCfg.SSLMode = "disable"
	}

	return dbCfg, nil
}

func GetDBConnString(d DBConfig) string {
	user := url.QueryEscape(d.User)
	pass := url.QueryEscape(d.Password)
	return fmt.Sprintf("pgx://%s:%s@%s:%d/%s?sslmode=%s",
		user, pass, d.Host, d.Port, d.DBName, d.SSLMode)
}

func NewServer(port int, handler http.Handler, readTimeout, writeTimeout time.Duration) *http.Server {
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
