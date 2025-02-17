package model

import (
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// GoogleIDTokenClaims 는 google ID 토큰을 담는 구조체.
// ParseWithClaims(...)가 호출되면, "claims.(ClaimsValidator)"로 인식되어 Validate()가 자동 호출됨.
type GoogleIDTokenClaims struct {
	googleClientID string

	Email   string `json:"email,omitempty"`
	Name    string `json:"name,omitempty"`
	Picture string `json:"picture,omitempty"`

	// 표준 등록 클레임 (exp, iss, aud, etc)
	jwt.RegisteredClaims
}

// SetGoogleClientID parse 전에 "내 클라이언트 ID"를 주입해둠.
func (c *GoogleIDTokenClaims) SetGoogleClientID(clientID string) {
	c.googleClientID = clientID
}

// Validate ParseWithClaims(...)시 자동 호출되는 ClaimsValidator.
func (c *GoogleIDTokenClaims) Validate() error {
	// 1) exp 체크
	// exp 없거나 만료됐으면 에러
	if c.ExpiresAt == nil {
		return errors.New("missing exp claim")
	}
	now := time.Now()
	if now.After(c.ExpiresAt.Time) {
		return errors.New("expired token")
	}

	// 2) iss 체크
	if c.Issuer != "https://accounts.google.com" && c.Issuer != "accounts.google.com" {
		return fmt.Errorf("invalid issuer: %s", c.Issuer)
	}

	// 3) aud 체크
	if len(c.Audience) < 1 {
		return errors.New("no aud claim")
	}
	if c.Audience[0] != c.googleClientID {
		return fmt.Errorf("invalid audience: got=%s, want=%s",
			c.Audience[0], c.googleClientID)
	}

	// 기타 필요 필드가 있으면 직접 체크 (nbf, iat 등)
	// ex) if c.IssuedAt == nil { ... } etc

	return nil
}
