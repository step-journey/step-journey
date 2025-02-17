package repository

import (
	"context"
	"database/sql"
	"github.com/pkg/errors"
	"server/internal/db"
	"server/internal/model"
)

type PostgresRefreshTokenRepo struct {
	db *db.DB
}

func NewPostgresRefreshTokenRepo(dbConn *db.DB) *PostgresRefreshTokenRepo {
	return &PostgresRefreshTokenRepo{db: dbConn}
}

// CreateOrUpdate 토큰이 이미 존재하면 업데이트하고, 없으면 새로 생성
func (r *PostgresRefreshTokenRepo) CreateOrUpdate(ctx context.Context, rt *model.RefreshToken) error {
	_, err := r.db.Pool.Exec(ctx,
		`INSERT INTO refresh_tokens (user_id, token, expired_at)
		 VALUES ($1, $2, $3)
		 ON CONFLICT (token) DO UPDATE
		   SET user_id = EXCLUDED.user_id,
		       expired_at = EXCLUDED.expired_at
		`,
		rt.UserID, rt.Token, rt.ExpiredAt)
	if err != nil {
		return errors.Wrap(err, "[CreateOrUpdate] insert/merge failed")
	}
	return nil
}

// FindByToken 토큰 문자열로 refresh_tokens 테이블을 조회하여, 매핑된 *model.RefreshToken 반환
func (r *PostgresRefreshTokenRepo) FindByToken(ctx context.Context, token string) (*model.RefreshToken, error) {
	row := r.db.Pool.QueryRow(ctx,
		`SELECT id, user_id, token, expired_at, created_at
		   FROM refresh_tokens
		  WHERE token = $1`,
		token,
	)
	var rt model.RefreshToken
	if err := row.Scan(&rt.ID, &rt.UserID, &rt.Token, &rt.ExpiredAt, &rt.CreatedAt); err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("[FindByToken] token not found")
		}
		return nil, errors.Wrap(err, "[FindByToken] query fail")
	}
	return &rt, nil
}

// DeleteByToken 토큰 문자열로 레코드를 삭제
func (r *PostgresRefreshTokenRepo) DeleteByToken(ctx context.Context, token string) error {
	_, err := r.db.Pool.Exec(ctx,
		`DELETE FROM refresh_tokens WHERE token = $1`,
		token,
	)
	if err != nil {
		return errors.Wrap(err, "[DeleteByToken] exec fail")
	}
	return nil
}
