package handler

import (
	"net/http"
	"os"
	"server/internal/service"
	"time"

	"github.com/rs/zerolog/log"
)

type AuthHandler struct {
	authService *service.AuthService
}

func NewAuthHandler(authSvc *service.AuthService) *AuthHandler {
	return &AuthHandler{authService: authSvc}
}

func (h *AuthHandler) HandleGoogleLogin(w http.ResponseWriter, r *http.Request) {
	loginURL, err := h.authService.GetGoogleLoginURL()
	if err != nil {
		log.Error().Err(err).Msg("[HandleGoogleLogin] failed to build google login URL")
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	http.Redirect(w, r, loginURL, http.StatusFound)
}

func (h *AuthHandler) HandleGoogleCallback(w http.ResponseWriter, r *http.Request) {
	code := r.URL.Query().Get("code")
	if code == "" {
		http.Error(w, "Missing code param", http.StatusBadRequest)
		return
	}
	// 1) OAuth 처리
	user, err := h.authService.ProcessGoogleCallback(r.Context(), code)
	if err != nil {
		log.Error().Err(err).Msg("[HandleGoogleCallback] Google OAuth failed")
		http.Error(w, "Google OAuth failed", http.StatusInternalServerError)
		return
	}

	// 2) 로그인 후 쿠키 저장
	if err := h.authService.LoginUserAndSetCookies(w, user); err != nil {
		log.Error().Err(err).Msg("[HandleGoogleCallback] LoginUserAndSetCookies failed")
		http.Error(w, "Login failed", http.StatusInternalServerError)
		return
	}

	// 3) 최종 리다이렉트
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:5173"
	}
	http.Redirect(w, r, frontendURL+"?login=success", http.StatusFound)
}

func (h *AuthHandler) HandleKakaoLogin(w http.ResponseWriter, r *http.Request) {
	loginURL, err := h.authService.GetKakaoLoginURL()
	if err != nil {
		log.Error().Err(err).Msg("[HandleKakaoLogin] failed to build kakao login URL")
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	http.Redirect(w, r, loginURL, http.StatusFound)
}

func (h *AuthHandler) HandleKakaoCallback(w http.ResponseWriter, r *http.Request) {
	code := r.URL.Query().Get("code")
	if code == "" {
		http.Error(w, "Missing code param", http.StatusBadRequest)
		return
	}
	user, err := h.authService.ProcessKakaoCallback(r.Context(), code)
	if err != nil {
		log.Error().Err(err).Msg("[HandleKakaoCallback] Kakao OAuth failed")
		http.Error(w, "Kakao OAuth failed", http.StatusInternalServerError)
		return
	}

	if err := h.authService.LoginUserAndSetCookies(w, user); err != nil {
		log.Error().Err(err).Msg("[HandleKakaoCallback] LoginUserAndSetCookies failed")
		http.Error(w, "Login failed", http.StatusInternalServerError)
		return
	}

	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:5173"
	}
	http.Redirect(w, r, frontendURL+"?login=success", http.StatusFound)
}

func (h *AuthHandler) HandleNaverLogin(w http.ResponseWriter, r *http.Request) {
	loginURL, err := h.authService.GetNaverLoginURL()
	if err != nil {
		log.Error().Err(err).Msg("[HandleNaverLogin] failed to build naver login URL")
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	http.Redirect(w, r, loginURL, http.StatusFound)
}

func (h *AuthHandler) HandleNaverCallback(w http.ResponseWriter, r *http.Request) {
	code := r.URL.Query().Get("code")
	state := r.URL.Query().Get("state")
	if code == "" {
		http.Error(w, "Missing code param", http.StatusBadRequest)
		return
	}
	user, err := h.authService.ProcessNaverCallback(r.Context(), code, state)
	if err != nil {
		log.Error().Err(err).Msg("[HandleNaverCallback] Naver OAuth failed")
		http.Error(w, "Naver OAuth failed", http.StatusInternalServerError)
		return
	}

	if err := h.authService.LoginUserAndSetCookies(w, user); err != nil {
		log.Error().Err(err).Msg("[HandleNaverCallback] LoginUserAndSetCookies failed")
		http.Error(w, "Login failed", http.StatusInternalServerError)
		return
	}

	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:5173"
	}
	http.Redirect(w, r, frontendURL+"?login=success", http.StatusFound)
}

func (h *AuthHandler) HandleLogout(w http.ResponseWriter, r *http.Request) {
	log.Info().Msg("[HandleLogout] Processing logout request")

	http.SetCookie(w, &http.Cookie{
		Name:     "access_token",
		Value:    "",
		Path:     "/",
		Expires:  time.Unix(0, 0),
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   os.Getenv("ENVIRONMENT") != "local",
		SameSite: http.SameSiteLaxMode,
	})

	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    "",
		Path:     "/",
		Expires:  time.Unix(0, 0),
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   os.Getenv("ENVIRONMENT") != "local",
		SameSite: http.SameSiteLaxMode,
	})

	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte("Logged out successfully"))
	log.Info().Msg("[HandleLogout] Logout completed, cookies cleared")
}
