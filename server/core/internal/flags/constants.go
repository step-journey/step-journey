package flags

const (
	EnvVarEnvironment = "ENVIRONMENT" // ECS Task Definition "environment" 필드

	EnvVarDbUserCredential = "DB_USER_CREDENTIAL" // ECS Task Definition "secrets" 필드 (AWS Secrets Manager 로부터 가져오는 값)
	EnvVarDbConnectionInfo = "DB_USER_CONNECTION_INFO"
	EnvVarOAuthSecret      = "OAUTH_SECRET"

	FlagEnv    = "env" // CLI 플래그 관련 상수 (플래그 이름)
	FlagConfig = "config-file"
)
