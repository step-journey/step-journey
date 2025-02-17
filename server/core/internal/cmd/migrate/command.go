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
			envName := c.String(flags.FlagEnv)

			// Load config
			cfg, err := config.LoadConfig(cfgFile, envName)
			if err != nil {
				return errors.Wrapf(err, "[migrateUp] LoadConfig failed (cfgFile=%s, env=%s)", cfgFile, envName)
			}

			// Build DBConfig
			dbCfg, err := cfg.ToDBConfig()
			if err != nil {
				return errors.Wrap(err, "[migrateUp] ToDBConfig failed")
			}

			// Get connection string
			connStr := config.GetDBConnString(dbCfg)

			// Migrate Up
			if err := db.MigrateDB(connStr, "up"); err != nil {
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
			envName := c.String(flags.FlagEnv)

			// Load config
			cfg, err := config.LoadConfig(cfgFile, envName)
			if err != nil {
				return errors.Wrapf(err,
					"[migrateDown] LoadConfig failed (cfgFile=%s, env=%s)", cfgFile, envName)
			}

			// Build DBConfig
			dbCfg, err := cfg.ToDBConfig()
			if err != nil {
				return errors.Wrap(err, "[migrateDown] ToDBConfig failed")
			}

			// Get connection string
			connStr := config.GetDBConnString(dbCfg)

			// Migrate down
			if err := db.MigrateDB(connStr, "down"); err != nil {
				return errors.Wrapf(err,
					"[migrateDown] MigrateDB failed (connStr=%s)", connStr)
			}
			return nil
		},
	}
}
