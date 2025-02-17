package flags

const (
	// ECS Task Definition "environment" 필드
	EnvVarEnvironment = "ENVIRONMENT"

	// ECS Task Definition "secrets" 필드 (AWS Secrets Manager 로부터 가져오는 값)
	EnvVarDbUserCredential = "DB_USER_CREDENTIAL"
	EnvVarDbConnectionInfo = "DB_USER_CONNECTION_INFO"
	EnvVarOAuthSecret      = "OAUTH_SECRET"

	// CLI 플래그 이름
	FlagEnv    = "env"
	FlagConfig = "config-file"

	// 환경
	EnvLocal = "local"
	EnvDev   = "dev"
	EnvProd  = "prod"

	// local 환경 OAuth 환경 변수 Key (.env 파일)
	EnvKeyOauthGoogleClientID     = "OAUTH_GOOGLE_CLIENT_ID"
	EnvKeyOauthGoogleClientSecret = "OAUTH_GOOGLE_CLIENT_SECRET"
	EnvKeyOauthNaverClientID      = "OAUTH_NAVER_CLIENT_ID"
	EnvKeyOauthNaverClientSecret  = "OAUTH_NAVER_CLIENT_SECRET"
	EnvKeyOauthKakaoRestApiKey    = "OAUTH_KAKAO_REST_API_KEY"
	EnvKeyOauthKakaoClientSecret  = "OAUTH_KAKAO_CLIENT_SECRET"
)
