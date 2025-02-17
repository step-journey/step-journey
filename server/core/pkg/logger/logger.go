package logger

import (
	"os"
	"time"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"server/internal/flags"
)

func InitLogger(env string) {
	zerolog.TimeFieldFormat = time.RFC3339Nano

	// 타임스탬프 함수를 UTC 기준으로 설정
	zerolog.TimestampFunc = func() time.Time {
		return time.Now().UTC()
	}

	var level zerolog.Level
	switch env {
	case flags.EnvProd:
		level = zerolog.InfoLevel
	case flags.EnvDev:
		level = zerolog.DebugLevel
	case flags.EnvLocal:
		level = zerolog.DebugLevel
	default:
		level = zerolog.DebugLevel
	}
	zerolog.SetGlobalLevel(level)

	// 로컬 환경인 경우 ConsoleWriter 사용하고, 그 외는 JSON 출력
	if env == flags.EnvLocal {
		log.Logger = log.Output(
			zerolog.ConsoleWriter{
				Out:        os.Stderr,
				TimeFormat: time.RFC3339,
			},
		)
	}

	log.Info().Msgf("[InitLogger] Logging Level: %s (env=%s)", level.String(), env)
}
