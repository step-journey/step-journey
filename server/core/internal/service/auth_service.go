package service

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"server/internal/config"
	"server/internal/model"
	"server/internal/repository"
	"strings"
	"time"

	"github.com/pkg/errors"
)

type AuthService struct {
	httpClient       *http.Client
	oAuthSecrets     *config.OAuthSecrets
	userRepo         repository.UserRepository
	refreshTokenRepo repository.RefreshTokenRepository
	jwtManager       *JWTManager
}

func NewAuthService(
	oAuthSecrets *config.OAuthSecrets,
	userRepo repository.UserRepository,
	refreshTokenRepo repository.RefreshTokenRepository,
	jwtManager *JWTManager,
) *AuthService {
	return &AuthService{
		httpClient:       &http.Client{Timeout: 10 * time.Second},
		oAuthSecrets:     oAuthSecrets,
		userRepo:         userRepo,
		refreshTokenRepo: refreshTokenRepo,
		jwtManager:       jwtManager,
	}
}

func (s *AuthService) GetGoogleLoginURL() (string, error) {
	clientID := s.oAuthSecrets.GoogleClientID
	if clientID == "" {
		return "", errors.New("[GetGoogleLoginURL] googleClientID is empty")
	}
	redirectURI := os.Getenv("GOOGLE_REDIRECT_URL")
	if redirectURI == "" {
		redirectURI = "http://localhost:8000/auth/google/callback"
	}
	scope := "profile email"

	// URL 빌드
	u := fmt.Sprintf(
		"https://accounts.google.com/o/oauth2/v2/auth?client_id=%s&redirect_uri=%s&response_type=code&scope=%s&access_type=offline&prompt=select_account",
		url.QueryEscape(clientID),
		url.QueryEscape(redirectURI),
		url.QueryEscape(scope),
	)
	return u, nil
}

func (s *AuthService) GetKakaoLoginURL() (string, error) {
	restAPIKey := s.oAuthSecrets.KakaoRestApiKey
	if restAPIKey == "" {
		return "", errors.New("[GetKakaoLoginURL] kakaoRestApiKey is empty")
	}
	redirectURI := "http://localhost:8000/auth/kakao/callback"
	scope := "account_email"

	u := fmt.Sprintf(
		"https://kauth.kakao.com/oauth/authorize?client_id=%s&redirect_uri=%s&response_type=code&scope=%s",
		url.QueryEscape(restAPIKey),
		url.QueryEscape(redirectURI),
		url.QueryEscape(scope),
	)
	return u, nil
}

func (s *AuthService) GetNaverLoginURL() (string, error) {
	clientID := s.oAuthSecrets.NaverClientID
	if clientID == "" {
		return "", errors.New("[GetNaverLoginURL] naverClientID is empty")
	}
	redirectURI := os.Getenv("NAVER_REDIRECT_URL")
	if redirectURI == "" {
		redirectURI = "http://localhost:8000/auth/naver/callback"
	}
	state := "someRandomState"

	u := fmt.Sprintf(
		"https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=%s&redirect_uri=%s&state=%s",
		url.QueryEscape(clientID),
		url.QueryEscape(redirectURI),
		url.QueryEscape(state),
	)
	return u, nil
}

func (s *AuthService) ProcessGoogleCallback(ctx context.Context, code string) (*model.User, error) {
	redirectURI := os.Getenv("GOOGLE_REDIRECT_URL")
	if redirectURI == "" {
		redirectURI = "http://localhost:8000/auth/google/callback"
	}

	tokenURL := "https://oauth2.googleapis.com/token"
	form := url.Values{}
	form.Set("code", code)
	form.Set("client_id", s.oAuthSecrets.GoogleClientID)
	form.Set("client_secret", s.oAuthSecrets.GoogleClientSecret)
	form.Set("redirect_uri", redirectURI)
	form.Set("grant_type", "authorization_code")

	req, err := http.NewRequestWithContext(ctx, "POST", tokenURL, strings.NewReader(form.Encode()))
	if err != nil {
		return nil, errors.Wrap(err, "[ProcessGoogleCallback] new request failed")
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	res, err := s.httpClient.Do(req)
	if err != nil {
		return nil, errors.Wrap(err, "[ProcessGoogleCallback] token exchange request failed")
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		return nil, errors.Errorf("[ProcessGoogleCallback] token exchange failed, status=%d", res.StatusCode)
	}

	var tokenResp struct {
		AccessToken string `json:"access_token"`
		IdToken     string `json:"id_token,omitempty"`
	}
	if err := json.NewDecoder(res.Body).Decode(&tokenResp); err != nil {
		return nil, errors.Wrap(err, "[ProcessGoogleCallback] decode tokenResp failed")
	}

	// 사용자 프로필 조회
	userinfoURL := "https://www.googleapis.com/oauth2/v2/userinfo"
	req2, err := http.NewRequestWithContext(ctx, "GET", userinfoURL, nil)
	if err != nil {
		return nil, errors.Wrap(err, "[ProcessGoogleCallback] new request2 failed")
	}
	req2.Header.Set("Authorization", "Bearer "+tokenResp.AccessToken)

	res2, err := s.httpClient.Do(req2)
	if err != nil {
		return nil, errors.Wrap(err, "[ProcessGoogleCallback] userinfo request failed")
	}
	defer res2.Body.Close()

	if res2.StatusCode != http.StatusOK {
		return nil, errors.Errorf("[ProcessGoogleCallback] userinfo request failed, status=%d", res2.StatusCode)
	}

	var googleUser struct {
		Id      string `json:"id"`
		Email   string `json:"email"`
		Name    string `json:"name"`
		Picture string `json:"picture"`
	}
	if err := json.NewDecoder(res2.Body).Decode(&googleUser); err != nil {
		return nil, errors.Wrap(err, "[ProcessGoogleCallback] decode googleUser failed")
	}
	if googleUser.Email == "" {
		return nil, errors.New("[ProcessGoogleCallback] no email in google userinfo")
	}
	nickname := googleUser.Name
	if nickname == "" {
		nickname = "GoogleUser"
	}

	user, err := s.upsertUser(ctx, "google", googleUser.Email, nickname, googleUser.Name, googleUser.Picture)
	if err != nil {
		return nil, errors.Wrap(err, "[ProcessGoogleCallback] upsertUser failed")
	}
	return user, nil
}

func (s *AuthService) ProcessKakaoCallback(ctx context.Context, code string) (*model.User, error) {
	redirectURI := "http://localhost:8000/auth/kakao/callback"
	tokenURL := "https://kauth.kakao.com/oauth/token"

	data := url.Values{}
	data.Set("grant_type", "authorization_code")
	data.Set("client_id", s.oAuthSecrets.KakaoRestApiKey)
	data.Set("redirect_uri", redirectURI)
	data.Set("code", code)
	if s.oAuthSecrets.KakaoClientSecret != "" {
		data.Set("client_secret", s.oAuthSecrets.KakaoClientSecret)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", tokenURL, strings.NewReader(data.Encode()))
	if err != nil {
		return nil, errors.Wrap(err, "[ProcessKakaoCallback] new request failed")
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	res, err := s.httpClient.Do(req)
	if err != nil {
		return nil, errors.Wrap(err, "[ProcessKakaoCallback] token exchange request failed")
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(res.Body)
		return nil, errors.Errorf("[ProcessKakaoCallback] token exchange failed, status=%d, body=%s",
			res.StatusCode, string(bodyBytes))
	}

	var tokenResp struct {
		AccessToken string `json:"access_token"`
		IdToken     string `json:"id_token,omitempty"`
	}
	if err := json.NewDecoder(res.Body).Decode(&tokenResp); err != nil {
		return nil, errors.Wrap(err, "[ProcessKakaoCallback] decode tokenResp failed")
	}

	// 사용자 정보 조회
	userInfoURL := "https://kapi.kakao.com/v2/user/me"
	req2, err := http.NewRequestWithContext(ctx, "GET", userInfoURL, nil)
	if err != nil {
		return nil, errors.Wrap(err, "[ProcessKakaoCallback] new request2 failed")
	}
	req2.Header.Set("Authorization", "Bearer "+tokenResp.AccessToken)

	res2, err := s.httpClient.Do(req2)
	if err != nil {
		return nil, errors.Wrap(err, "[ProcessKakaoCallback] userinfo request failed")
	}
	defer res2.Body.Close()

	if res2.StatusCode != http.StatusOK {
		return nil, errors.Errorf("[ProcessKakaoCallback] userinfo request failed, status=%d", res2.StatusCode)
	}

	var kakaoResp struct {
		Id           int64 `json:"id"`
		KakaoAccount struct {
			Email   string `json:"email"`
			Profile struct {
				Nickname   string `json:"nickname"`
				ProfileImg string `json:"profile_image_url"`
			} `json:"profile"`
		} `json:"kakao_account"`
	}
	if err := json.NewDecoder(res2.Body).Decode(&kakaoResp); err != nil {
		return nil, errors.Wrap(err, "[ProcessKakaoCallback] decode kakaoResp failed")
	}

	email := kakaoResp.KakaoAccount.Email
	name := kakaoResp.KakaoAccount.Profile.Nickname
	profileImg := kakaoResp.KakaoAccount.Profile.ProfileImg

	user, err := s.upsertUser(ctx, "kakao", email, name, name, profileImg)
	if err != nil {
		return nil, errors.Wrap(err, "[ProcessKakaoCallback] upsertUser failed")
	}
	return user, nil
}

func (s *AuthService) ProcessNaverCallback(ctx context.Context, code, state string) (*model.User, error) {
	redirectURI := os.Getenv("NAVER_REDIRECT_URL")
	if redirectURI == "" {
		redirectURI = "http://localhost:8000/auth/naver/callback"
	}

	tokenURL := "https://nid.naver.com/oauth2.0/token"
	data := url.Values{}
	data.Set("grant_type", "authorization_code")
	data.Set("client_id", s.oAuthSecrets.NaverClientID)
	data.Set("client_secret", s.oAuthSecrets.NaverClientSecret)
	data.Set("code", code)
	data.Set("state", state)
	data.Set("redirect_uri", redirectURI)

	req, err := http.NewRequestWithContext(ctx, "POST", tokenURL, strings.NewReader(data.Encode()))
	if err != nil {
		return nil, errors.Wrap(err, "[ProcessNaverCallback] new request failed")
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	res, err := s.httpClient.Do(req)
	if err != nil {
		return nil, errors.Wrap(err, "[ProcessNaverCallback] token exchange request failed")
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("[ProcessNaverCallback] token exchange failed, status=%d", res.StatusCode)
	}

	var tokenResp struct {
		AccessToken string `json:"access_token"`
	}
	if err := json.NewDecoder(res.Body).Decode(&tokenResp); err != nil {
		return nil, errors.Wrap(err, "[ProcessNaverCallback] decode tokenResp failed")
	}

	// 사용자 정보 조회
	userInfoURL := "https://openapi.naver.com/v1/nid/me"
	req2, err := http.NewRequestWithContext(ctx, "GET", userInfoURL, nil)
	if err != nil {
		return nil, errors.Wrap(err, "[ProcessNaverCallback] new request2 failed")
	}
	req2.Header.Set("Authorization", "Bearer "+tokenResp.AccessToken)

	res2, err := s.httpClient.Do(req2)
	if err != nil {
		return nil, errors.Wrap(err, "[ProcessNaverCallback] userinfo request failed")
	}
	defer res2.Body.Close()

	if res2.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("[ProcessNaverCallback] userinfo request failed, status=%d", res2.StatusCode)
	}

	var naverResp struct {
		ResultCode string `json:"resultcode"`
		Message    string `json:"message"`
		Response   struct {
			Id           string `json:"id"`
			Email        string `json:"email"`
			Nickname     string `json:"nickname"`
			ProfileImage string `json:"profile_image"`
			Name         string `json:"name"`
		} `json:"response"`
	}
	if err := json.NewDecoder(res2.Body).Decode(&naverResp); err != nil {
		return nil, errors.Wrap(err, "[ProcessNaverCallback] decode naverResp failed")
	}

	email := naverResp.Response.Email
	name := naverResp.Response.Nickname
	if name == "" {
		name = naverResp.Response.Name
	}
	profileImg := naverResp.Response.ProfileImage

	user, err := s.upsertUser(ctx, "naver", email, name, name, profileImg)
	if err != nil {
		return nil, errors.Wrap(err, "[ProcessNaverCallback] upsertUser failed")
	}
	return user, nil
}

func (s *AuthService) LoginUserAndSetCookies(w http.ResponseWriter, user *model.User) error {
	user.VisitsCount++
	if err := s.userRepo.UpdateUser(context.Background(), user); err != nil {
		return errors.Wrap(err, "[LoginUserAndSetCookies] update user visits_count failed")
	}

	refreshTokenStr, err := s.jwtManager.GenerateRefreshToken(user)
	if err != nil {
		return errors.Wrap(err, "[LoginUserAndSetCookies] generate refresh token failed")
	}
	expireTime := time.Now().Add(s.jwtManager.RefreshTokenTTL)

	// 변경 전: s.refreshTokenRepo.SaveRefreshToken(ctx, user.ID, refreshTokenStr, expireTime)
	// 변경 후:
	rt := &model.RefreshToken{
		UserID:    user.ID,
		Token:     refreshTokenStr,
		ExpiredAt: expireTime,
	}
	if err := s.refreshTokenRepo.CreateOrUpdate(context.Background(), rt); err != nil {
		return errors.Wrap(err, "[LoginUserAndSetCookies] createOrUpdate refresh token failed")
	}

	// Access Token도 동일
	accessTokenStr, err := s.jwtManager.GenerateAccessToken(user)
	if err != nil {
		return errors.Wrap(err, "[LoginUserAndSetCookies] generate access token failed")
	}

	// ... 쿠키 세팅 로직은 동일 ...
	s.setCookie(w, "access_token", accessTokenStr, s.jwtManager.AccessTokenTTL)
	s.setCookie(w, "refresh_token", refreshTokenStr, s.jwtManager.RefreshTokenTTL)
	return nil
}

func (s *AuthService) setCookie(w http.ResponseWriter, name, value string, ttl time.Duration) {
	domain := os.Getenv("COOKIE_DOMAIN")
	if domain == "" {
		domain = "localhost"
	}
	secureFlag := true
	if os.Getenv("ENVIRONMENT") == "local" {
		secureFlag = false
	}
	http.SetCookie(w, &http.Cookie{
		Name:     name,
		Value:    value,
		Path:     "/",
		Domain:   domain,
		Secure:   secureFlag,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Expires:  time.Now().Add(ttl),
		MaxAge:   int(ttl.Seconds()),
	})
}

// ----------------------------------------------------
// 4) 유저가 없으면 새로 insert, 있으면 그대로
// ----------------------------------------------------
func (s *AuthService) upsertUser(
	ctx context.Context,
	provider, email, nickname, name, profileImg string,
) (*model.User, error) {
	u, err := s.userRepo.FindByEmail(ctx, email)
	if err != nil {
		// 없는 경우 새로 생성
		newUser := &model.User{
			OauthProvider: provider,
			Email:         email,
			Nickname:      nickname,
			Name:          name,
			ProfileImage:  profileImg,
			Role:          "USER",
			VisitsCount:   1,
		}
		created, createErr := s.userRepo.CreateUser(ctx, newUser)
		if createErr != nil {
			return nil, createErr
		}
		return created, nil
	}
	return u, nil
}
