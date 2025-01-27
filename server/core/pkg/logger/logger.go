package logger

import (
	"os"
	"time"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

func InitLogger(env string) {
	zerolog.TimeFieldFormat = time.RFC3339Nano

	// 타임스탬프 함수를 UTC 고정
	zerolog.TimestampFunc = func() time.Time {
		return time.Now().UTC()
	}

	var level zerolog.Level
	switch env {
	case "prod":
		level = zerolog.InfoLevel
	case "dev":
		level = zerolog.DebugLevel
	default:
		level = zerolog.DebugLevel
	}
	zerolog.SetGlobalLevel(level)

	// local 환경만 ConsoleWriter 출력, 그 외는 JSON 출력
	if env == "local" {
		log.Logger = log.Output(
			zerolog.ConsoleWriter{
				Out:        os.Stderr,
				TimeFormat: time.RFC3339,
			},
		)
	}
	log.Info().Msgf("[InitLogger] Logging Level: %s (env=%s)", level.String(), env)
}
