package main

import (
	"os"

	"github.com/rs/zerolog/log"
	"github.com/urfave/cli/v2"

	"server/internal/cmd/migrate"
	"server/internal/cmd/serve"
	"server/internal/flags"
	"server/pkg/logger"
)

func main() {
	app := &cli.App{
		Name:   "step-journey",
		Usage:  "Step Journey API Server",
		Flags:  flags.GlobalFlags,
		Before: initializeApp,
		Commands: []*cli.Command{
			serve.NewCommand(),
			migrate.NewCommand(),
		},
	}

	if err := app.Run(os.Args); err != nil {
		log.Error().Err(err).Msg("[main] CLI run error")
		os.Exit(1)
	}
}

// CLI 시작 전에 공통적으로 실행할 로직
func initializeApp(c *cli.Context) error {
	env := os.Getenv(flags.EnvVarEnvironment)
	logger.InitLogger(env)
	return nil
}
