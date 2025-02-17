package service

import (
	"context"
	"server/internal/model"
	"server/internal/repository"
)

type UserService struct {
	userRepo repository.UserRepository
}

func NewUserService(r repository.UserRepository) *UserService {
	return &UserService{userRepo: r}
}

func (s *UserService) ListUsers(ctx context.Context) ([]model.User, error) {
	return s.userRepo.ListAllUsers(ctx)
}

func (s *UserService) CreateUser(ctx context.Context, username string) (*model.User, error) {
	// 임의로 Email / Name / Nickname 등에 username 활용
	newUser := &model.User{
		OauthProvider: "local",
		Email:         username + "@dummy.local",
		Name:          username,
		Nickname:      username,
		ProfileImage:  "",
		Role:          "USER",
		VisitsCount:   1,
	}
	return s.userRepo.CreateUser(ctx, newUser)
}

func (s *UserService) FindByID(ctx context.Context, userID int) (*model.User, error) {
	return s.userRepo.FindByID(ctx, userID)
}
