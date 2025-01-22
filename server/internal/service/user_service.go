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
	return s.userRepo.ListUsers(ctx)
}

func (s *UserService) CreateUser(ctx context.Context, username string) (*model.User, error) {
	return s.userRepo.CreateUser(ctx, username)
}
