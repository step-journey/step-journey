package handler

import (
	"encoding/json"
	"net/http"
	"server/internal/service"

	"github.com/rs/zerolog/log"
)

type UserHandler struct {
	userSvc *service.UserService
}

func NewUserHandler(svc *service.UserService) *UserHandler {
	return &UserHandler{userSvc: svc}
}

func (h *UserHandler) ListUsers(w http.ResponseWriter, r *http.Request) {
	users, err := h.userSvc.ListUsers(r.Context())
	if err != nil {
		log.Error().Err(err).Msg("[UserHandler] failed to list users")
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}

func (h *UserHandler) CreateUser(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Username string `json:"username"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Bad Request", http.StatusBadRequest)
		return
	}

	user, err := h.userSvc.CreateUser(r.Context(), req.Username)
	if err != nil {
		log.Error().Err(err).
			Str("username", req.Username).
			Msg("[UserHandler] failed to create user")
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

func (h *UserHandler) HandleMe(w http.ResponseWriter, r *http.Request) {
	// AuthMiddleware 에서 "userID"를 context 에 넣어 줌
	userID, ok := r.Context().Value("userID").(int)
	if !ok || userID <= 0 {
		http.Error(w, "Unauthorized (invalid context)", http.StatusUnauthorized)
		return
	}

	user, err := h.userSvc.FindByID(r.Context(), userID)
	if err != nil {
		log.Error().Err(err).Msgf("[HandleMe] cannot find user by ID=%d", userID)
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	resp := map[string]interface{}{
		"id":    user.ID,
		"name":  user.Nickname, // 예) nickname 을 클라이언트에 name 으로 내려줌
		"email": user.Email,
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}
