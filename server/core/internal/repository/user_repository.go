package repository

import (
	"context"
	"server/internal/model"
)

type UserRepository interface {
	ListAllUsers(ctx context.Context) ([]model.User, error) // <--- 추가
	CreateUser(ctx context.Context, user *model.User) (*model.User, error)
	FindByEmail(ctx context.Context, email string) (*model.User, error)
	FindByID(ctx context.Context, id int) (*model.User, error)
	UpdateUser(ctx context.Context, user *model.User) error
}
