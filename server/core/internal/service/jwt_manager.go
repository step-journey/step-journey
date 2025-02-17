package service

import (
	"encoding/json"
	"fmt"
	"github.com/golang-jwt/jwt/v5"
	"os"
	"server/internal/model"
	"strconv"
	"strings"
	"time"

	"github.com/pkg/errors"
)

type JWTManager struct {
	SecretKey       string
	AccessTokenTTL  time.Duration
	RefreshTokenTTL time.Duration
}

func NewJWTManager() *JWTManager {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "local-dev-secret"
	}
	accessTTL := 15 * time.Minute
	refreshTTL := 24 * time.Hour * 14 // 2주

	return &JWTManager{
		SecretKey:       secret,
		AccessTokenTTL:  accessTTL,
		RefreshTokenTTL: refreshTTL,
	}
}

// GenerateAccessToken user 정보 기반으로 Access JWT 발급
func (j *JWTManager) GenerateAccessToken(user *model.User) (string, error) {
	now := time.Now()
	claims := jwt.MapClaims{
		"sub":   fmt.Sprintf("user:%d", user.ID), // ex) "user:123"
		"email": user.Email,
		"role":  user.Role,
		"exp":   now.Add(j.AccessTokenTTL).Unix(),
		"iat":   now.Unix(),
		"iss":   "step-journey", // issuer
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(j.SecretKey))
}

// GenerateRefreshToken 별도 클레임 or 식별자
func (j *JWTManager) GenerateRefreshToken(user *model.User) (string, error) {
	now := time.Now()
	claims := jwt.MapClaims{
		"sub":   fmt.Sprintf("user:%d", user.ID),
		"exp":   now.Add(j.RefreshTokenTTL).Unix(),
		"iat":   now.Unix(),
		"iss":   "step-journey",
		"scope": "refresh",
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(j.SecretKey))
}

// VerifyToken 토큰 파싱 & 검증 - jwt.ParseWithClaims 를 사용하여 커스텀 클레임(mapClaimsWrapper)으로 파싱
func (j *JWTManager) VerifyToken(tokenStr string) (*jwt.Token, error) {
	claims := &mapClaimsWrapper{MapClaims: jwt.MapClaims{}}
	token, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
		// HS256 검증
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.Errorf("[VerifyToken] unexpected signing method: %v", t.Header["alg"])
		}
		return []byte(j.SecretKey), nil
	})
	if err != nil {
		return nil, errors.Wrap(err, "[VerifyToken] parse error")
	}
	if !token.Valid {
		return nil, errors.New("[VerifyToken] invalid token")
	}
	return token, nil
}

// MapClaimsWithSubID 인터페이스: 토큰 Claims 에서 userID를 추출하기 위한 메서드 GetUserID()를 정의
type MapClaimsWithSubID interface {
	jwt.Claims
	GetUserID() int
}

// mapClaimsWrapper jwt.MapClaims 를 embedding 하여 MapClaimsWithSubID 인터페이스를 구현
type mapClaimsWrapper struct {
	jwt.MapClaims
}

func (w *mapClaimsWrapper) UnmarshalJSON(data []byte) error {
	var m jwt.MapClaims
	if err := json.Unmarshal(data, &m); err != nil {
		return err
	}
	w.MapClaims = m
	return nil
}

func (w *mapClaimsWrapper) Valid() error {
	// GetExpirationTime()는 jwt.MapClaims 에 기본 제공되지 않으므로, exp 값을 직접 추출
	exp, ok := w.MapClaims["exp"].(float64)
	if !ok {
		return errors.New("[mapClaimsWrapper.Valid] missing exp claim")
	}
	if time.Now().After(time.Unix(int64(exp), 0)) {
		return errors.New("[mapClaimsWrapper.Valid] token is expired")
	}
	return nil
}

// GetUserID "sub" 클레임에서 userID를 추출
func (w *mapClaimsWrapper) GetUserID() int {
	subVal, ok := w.MapClaims["sub"].(string)
	if !ok {
		return 0
	}
	parts := strings.Split(subVal, ":")
	if len(parts) != 2 || parts[0] != "user" {
		return 0
	}
	id, err := strconv.Atoi(parts[1])
	if err != nil {
		return 0
	}
	return id
}
