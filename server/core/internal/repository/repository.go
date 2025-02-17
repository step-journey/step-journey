package repository

import (
	"context"
	"server/internal/model"
)

type RefreshTokenRepository interface {
	CreateOrUpdate(ctx context.Context, rt *model.RefreshToken) error
	FindByToken(ctx context.Context, token string) (*model.RefreshToken, error)
	DeleteByToken(ctx context.Context, token string) error
}
