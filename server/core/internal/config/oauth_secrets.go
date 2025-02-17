package config

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"sync"

	"github.com/rs/zerolog/log"
	"server/internal/flags"
)

// OAuthSecrets AWS Secrets Manager 에 저장된 JSON (google / naver / kakao 등)
type OAuthSecrets struct {
	GoogleClientID     string `json:"google_client_id"`
	GoogleClientSecret string `json:"google_client_secret"`

	NaverClientID     string `json:"naver_client_id"`
	NaverClientSecret string `json:"naver_client_secret"`

	KakaoRestApiKey   string `json:"kakao_rest_api_key"`
	KakaoClientSecret string `json:"kakao_client_secret"`
}

var (
	secretsOnce     sync.Once
	secretsInstance *OAuthSecrets
	secretsInitErr  error
)

// GetOAuthSecrets 싱글톤 OAUTH 시크릿 반환
// 첫 호출 시에만 실제 ENV 파싱/로그를 남기고, 이후에는 캐싱된 secretsInstance 를 재사용
func GetOAuthSecrets() (*OAuthSecrets, error) {
	secretsOnce.Do(func() {
		secretsInstance, secretsInitErr = loadAllOAuthSecrets()
	})
	return secretsInstance, secretsInitErr
}

// 실제 ENV 파싱 로직: sync.Once 내부에서만 1회 실행
func loadAllOAuthSecrets() (*OAuthSecrets, error) {
	raw := os.Getenv(flags.EnvVarOAuthSecret)
	if raw == "" {
		googleID := os.Getenv(flags.EnvKeyOauthGoogleClientID)
		googleSecret := os.Getenv(flags.EnvKeyOauthGoogleClientSecret)

		naverID := os.Getenv(flags.EnvKeyOauthNaverClientID)
		naverSecret := os.Getenv(flags.EnvKeyOauthNaverClientSecret)

		kakaoRestApiKey := os.Getenv(flags.EnvKeyOauthKakaoRestApiKey)
		kakaoSecret := os.Getenv(flags.EnvKeyOauthKakaoClientSecret)

		log.Debug().
			Str("google_client_id", googleID).
			Str("naver_client_id", naverID).
			Str("kakao_rest_api_key", kakaoRestApiKey).
			Msg("[GetOAuthSecrets] OAUTH_SECRET is empty, fallback to local env")

		return &OAuthSecrets{
			GoogleClientID:     googleID,
			GoogleClientSecret: googleSecret,
			NaverClientID:      naverID,
			NaverClientSecret:  naverSecret,
			KakaoRestApiKey:    kakaoRestApiKey,
			KakaoClientSecret:  kakaoSecret,
		}, nil
	}

	dec := json.NewDecoder(strings.NewReader(raw))
	dec.DisallowUnknownFields()

	var secrets OAuthSecrets
	if err := dec.Decode(&secrets); err != nil {
		return nil, fmt.Errorf("[GetOAuthSecrets] JSON decode error: %w", err)
	}

	// log.Debug().Msg("[GetOAuthSecrets] loaded from OAUTH_SECRET JSON successfully")
	return &secrets, nil
}
