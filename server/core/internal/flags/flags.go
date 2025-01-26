package flags

import "github.com/urfave/cli/v2"

const (
	FlagEnv     = "env"
	FlagConfig  = "config-file"
	FlagEnvFile = "env-file"
)

var GlobalFlags = []cli.Flag{
	&cli.StringFlag{
		Name:  FlagEnv,
		Usage: "Environment name (local, dev, prod, etc.)",
		Value: "local",
	},
	&cli.StringFlag{
		Name:  FlagConfig,
		Usage: "Path to config file (YAML)",
		Value: "./configs/config.yaml",
	},
	&cli.StringFlag{
		Name:  FlagEnvFile,
		Usage: "Path to .env file",
		Value: "./configs/.env",
	},
}
