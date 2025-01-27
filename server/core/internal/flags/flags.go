package flags

import "github.com/urfave/cli/v2"

const (

	// ECS Task Definition 에 정의된 환경변수

	EnvVarEnvironment      = "ENVIRONMENT"
	EnvVarDbUserCredential = "DB_USER_CREDENTIAL"
	EnvVarDbConnectionInfo = "DB_CONNECTION_INFO"

	// CLI 플래그 관련 상수

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
