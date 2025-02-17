package middleware

import (
	"context"
	"net/http"
	"os"
	"server/internal/flags"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/pkg/errors"
	"github.com/rs/zerolog/log"
	"server/internal/repository"
	"server/internal/service"
)

type AuthMiddleware struct {
	jwtManager       *service.JWTManager
	refreshTokenRepo repository.RefreshTokenRepository
	userRepo         repository.UserRepository
}

func NewAuthMiddleware(
	jwtManager *service.JWTManager,
	refreshRepo repository.RefreshTokenRepository,
	userRepo repository.UserRepository,
) *AuthMiddleware {
	return &AuthMiddleware{
		jwtManager:       jwtManager,
		refreshTokenRepo: refreshRepo,
		userRepo:         userRepo,
	}
}

func (m *AuthMiddleware) Handle(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Info().Msgf("[AuthMiddleware] Incoming request: method=%s, url=%s", r.Method, r.URL.String())

		// 1) 쿠키에서 access_token, refresh_token 읽기
		accessCookie, err := r.Cookie("access_token")
		if err != nil {
			log.Warn().Err(err).Msg("[AuthMiddleware] Missing access_token cookie")
			// access_token 쿠키가 없으면 refresh_token으로 재발급 시도
			refreshCookie, err := r.Cookie("refresh_token")
			if err != nil {
				log.Error().Msg("[AuthMiddleware] Missing refresh_token cookie as well")
				http.Error(w, "Unauthorized (no tokens)", http.StatusUnauthorized)
				return
			}
			log.Info().Msgf("[AuthMiddleware] Found refresh_token cookie, value=%s", refreshCookie.Value)
			log.Info().Msg("[AuthMiddleware] Attempting to reissue access token using refresh token")
			newToken, reissueErr := m.tryReissueAccessToken(w, refreshCookie.Value)
			if reissueErr != nil {
				log.Error().Err(reissueErr).Msg("[AuthMiddleware] Failed to reissue access token")
				http.Error(w, "Unauthorized (refresh token invalid)", http.StatusUnauthorized)
				return
			}
			log.Info().Msg("[AuthMiddleware] Access token reissued successfully")
			log.Info().Msgf("[AuthMiddleware] Raw token (reissued): %s", newToken.Raw)
			// 새로 재발급한 토큰에서 사용자 정보를 추출하여 context에 추가
			claims, ok := newToken.Claims.(service.MapClaimsWithSubID)
			if !ok {
				log.Error().Msgf("[AuthMiddleware] Invalid token claims after reissue, claims type=%T, raw claims=%+v", newToken.Claims, newToken.Claims)
				http.Error(w, "Unauthorized (invalid token claims)", http.StatusUnauthorized)
				return
			}
			userID := claims.GetUserID()
			log.Info().Msgf("[AuthMiddleware] Extracted userID from reissued token claims: %d", userID)
			if userID == 0 {
				log.Error().Msgf("[AuthMiddleware] No userID found in token claims after reissue, raw claims=%+v", newToken.Claims)
				http.Error(w, "Unauthorized (no user in token)", http.StatusUnauthorized)
				return
			}
			ctx := context.WithValue(r.Context(), "userID", userID)
			r = r.WithContext(ctx)
			next.ServeHTTP(w, r)
			return
		}

		log.Info().Msgf("[AuthMiddleware] Access token cookie found, value=%s", accessCookie.Value)

		// 2) Access Token 검증
		token, parseErr := m.jwtManager.VerifyToken(accessCookie.Value)
		if parseErr != nil {
			log.Warn().Err(parseErr).Msg("[AuthMiddleware] Access token verification failed, attempting reissue using refresh token")
			refreshCookie, err := r.Cookie("refresh_token")
			if err != nil {
				log.Error().Msg("[AuthMiddleware] Missing refresh_token cookie")
				http.Error(w, "Unauthorized (no refresh token)", http.StatusUnauthorized)
				return
			}
			log.Info().Msgf("[AuthMiddleware] Found refresh_token cookie, value=%s", refreshCookie.Value)
			newToken, reissueErr := m.tryReissueAccessToken(w, refreshCookie.Value)
			if reissueErr != nil {
				log.Error().Err(reissueErr).Msg("[AuthMiddleware] Failed to reissue access token")
				http.Error(w, "Unauthorized (refresh token invalid)", http.StatusUnauthorized)
				return
			}
			log.Info().Msg("[AuthMiddleware] Access token reissued successfully")
			log.Info().Msgf("[AuthMiddleware] Raw token (reissued): %s", newToken.Raw)
			claims, ok := newToken.Claims.(service.MapClaimsWithSubID)
			if !ok {
				log.Error().Msgf("[AuthMiddleware] Invalid token claims after reissue, claims type=%T, raw claims=%+v", newToken.Claims, newToken.Claims)
				http.Error(w, "Unauthorized (invalid token claims)", http.StatusUnauthorized)
				return
			}
			userID := claims.GetUserID()
			log.Info().Msgf("[AuthMiddleware] Extracted userID from reissued token claims: %d", userID)
			if userID == 0 {
				log.Error().Msgf("[AuthMiddleware] No userID found in token claims after reissue, raw claims=%+v", newToken.Claims)
				http.Error(w, "Unauthorized (no user in token)", http.StatusUnauthorized)
				return
			}
			ctx := context.WithValue(r.Context(), "userID", userID)
			r = r.WithContext(ctx)
			next.ServeHTTP(w, r)
			return
		}

		if !token.Valid {
			log.Warn().Msg("[AuthMiddleware] Token is not valid")
			http.Error(w, "Unauthorized (invalid token)", http.StatusUnauthorized)
			return
		}

		// 로깅: 검증된 토큰의 원시 클레임 내용
		log.Info().Msgf("[AuthMiddleware] Raw token claims: %+v", token.Claims)

		// 3) 토큰 클레임에서 userID 추출 → Context에 저장
		claims, ok := token.Claims.(service.MapClaimsWithSubID)
		if !ok {
			log.Error().Msgf("[AuthMiddleware] Failed to extract claims from token, claims type=%T, raw claims=%+v", token.Claims, token.Claims)
			http.Error(w, "Unauthorized (invalid claims)", http.StatusUnauthorized)
			return
		}
		userID := claims.GetUserID()
		log.Info().Msgf("[AuthMiddleware] Extracted userID from token claims: %d", userID)
		if userID == 0 {
			log.Error().Msgf("[AuthMiddleware] No userID found in token claims, raw claims=%+v", token.Claims)
			http.Error(w, "Unauthorized (no user in token)", http.StatusUnauthorized)
			return
		}

		log.Info().Msgf("[AuthMiddleware] Token verified successfully, userID: %d", userID)

		ctx := context.WithValue(r.Context(), "userID", userID)
		r = r.WithContext(ctx)

		next.ServeHTTP(w, r)
	})
}

// tryReissueAccessToken refresh token 을 통해 새 Access Token을 재발급하고, 재발급된 토큰을 반환
func (m *AuthMiddleware) tryReissueAccessToken(w http.ResponseWriter, refreshToken string) (*jwt.Token, error) {
	log.Info().Msgf("[tryReissueAccessToken] Attempting to reissue access token using refresh token: %s", refreshToken)
	// 1) refresh_tokens 테이블 조회
	rt, err := m.refreshTokenRepo.FindByToken(context.Background(), refreshToken)
	if err != nil {
		log.Error().Err(err).Msgf("[tryReissueAccessToken] Refresh token not found in DB, token=%s", refreshToken)
		return nil, errors.Wrap(err, "[tryReissueAccessToken] refresh token not found in DB")
	}
	log.Info().Msgf("[tryReissueAccessToken] Retrieved refresh token from DB: userID=%d, expired_at=%s", rt.UserID, rt.ExpiredAt.Format(time.RFC3339))
	if time.Now().After(rt.ExpiredAt) {
		log.Error().Msg("[tryReissueAccessToken] Refresh token expired")
		return nil, errors.New("[tryReissueAccessToken] refresh token expired")
	}

	// 2) userRepo를 통해 rt.UserID로 유저 정보 조회
	user, err := m.userRepo.FindByID(context.Background(), rt.UserID)
	if err != nil {
		log.Error().Err(err).Msgf("[tryReissueAccessToken] Cannot find user by ID=%d", rt.UserID)
		return nil, errors.Wrapf(err, "[tryReissueAccessToken] cannot find user by ID=%d", rt.UserID)
	}
	log.Info().Msgf("[tryReissueAccessToken] Found user: %+v", user)

	// 3) 새 Access Token 생성
	newAccessToken, err := m.jwtManager.GenerateAccessToken(user)
	if err != nil {
		log.Error().Err(err).Msg("[tryReissueAccessToken] Failed to generate new access token")
		return nil, errors.Wrap(err, "[tryReissueAccessToken] failed to generate new access token")
	}
	log.Info().Msgf("[tryReissueAccessToken] Generated new access token: %s", newAccessToken)

	// 4) 개발 환경에 따른 Secure 쿠키 설정: 로컬 개발 환경(HTTP)에서는 Secure false
	secureFlag := true
	if os.Getenv(flags.EnvVarEnvironment) == "local" {
		secureFlag = false
	}
	// access_token 쿠키 재설정
	http.SetCookie(w, &http.Cookie{
		Name:     "access_token",
		Value:    newAccessToken,
		Path:     "/",
		HttpOnly: true,
		Secure:   secureFlag,
		SameSite: http.SameSiteLaxMode,
		Expires:  time.Now().Add(m.jwtManager.AccessTokenTTL),
		MaxAge:   int(m.jwtManager.AccessTokenTTL.Seconds()),
	})
	log.Info().Msgf("[tryReissueAccessToken] Set new access token in cookie with secure=%t", secureFlag)

	// 5) 새 토큰을 파싱하여 반환
	parsedToken, err := m.jwtManager.VerifyToken(newAccessToken)
	if err != nil {
		log.Error().Err(err).Msg("[tryReissueAccessToken] Failed to parse new access token")
		return nil, errors.Wrap(err, "[tryReissueAccessToken] failed to parse new access token")
	}
	log.Info().Msgf("[tryReissueAccessToken] Successfully parsed new token, raw=%s", parsedToken.Raw)
	return parsedToken, nil
}
