package repository

import (
	"context"
	"server/internal/model"
)

type UserRepository interface {
	ListUsers(ctx context.Context) ([]model.User, error)
	CreateUser(ctx context.Context, username string) (*model.User, error)
}
