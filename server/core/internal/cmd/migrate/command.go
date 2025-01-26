package migrate

import (
	"github.com/pkg/errors"
	"github.com/urfave/cli/v2"

	"server/internal/config"
	"server/internal/db"
	"server/internal/flags"
)

func NewCommand() *cli.Command {
	return &cli.Command{
		Name:  "migrate",
		Usage: "Perform database migrations (up, down)",
		Subcommands: []*cli.Command{
			newUpCommand(),
			newDownCommand(),
		},
	}
}

func newUpCommand() *cli.Command {
	return &cli.Command{
		Name:  "up",
		Usage: "Migrate DB schema up",
		Action: func(c *cli.Context) error {
			cfgFile := c.String(flags.FlagConfig)
			envFile := c.String(flags.FlagEnvFile)
			envName := c.String(flags.FlagEnv)

			cfg, err := config.LoadConfig(cfgFile, envName, envFile)
			if err != nil {
				return errors.Wrapf(err,
					"[migrateUp] LoadConfig failed (cfgFile=%s, env=%s, envFile=%s)",
					cfgFile, envName, envFile)
			}

			connStr := config.GetDBConnString(cfg.ToDBConfig())

			if err := db.MigrateDB(connStr, "migrations", "up"); err != nil {
				return errors.Wrapf(err,
					"[migrateUp] MigrateDB failed (connStr=%s)", connStr)
			}
			return nil
		},
	}
}

func newDownCommand() *cli.Command {
	return &cli.Command{
		Name:  "down",
		Usage: "Rollback DB schema (down)",
		Action: func(c *cli.Context) error {
			cfgFile := c.String(flags.FlagConfig)
			envFile := c.String(flags.FlagEnvFile)
			envName := c.String(flags.FlagEnv)

			cfg, err := config.LoadConfig(cfgFile, envName, envFile)
			if err != nil {
				return errors.Wrapf(err,
					"[migrateDown] LoadConfig failed (cfgFile=%s, env=%s, envFile=%s)",
					cfgFile, envName, envFile)
			}

			connStr := config.GetDBConnString(cfg.ToDBConfig())

			if err := db.MigrateDB(connStr, "migrations", "down"); err != nil {
				return errors.Wrapf(err,
					"[migrateDown] MigrateDB failed (connStr=%s)", connStr)
			}
			return nil
		},
	}
}
