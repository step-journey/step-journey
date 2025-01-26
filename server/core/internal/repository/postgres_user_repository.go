package repository

import (
	"context"
	"github.com/pkg/errors"
	"server/internal/db"
	"server/internal/model"
)

type PostgresUserRepository struct {
	db *db.DB
}

func NewPostgresUserRepository(dbConn *db.DB) *PostgresUserRepository {
	return &PostgresUserRepository{db: dbConn}
}

func (r *PostgresUserRepository) ListUsers(ctx context.Context) ([]model.User, error) {
	// 실제 Postgres 쿼리
	rows, err := r.db.Pool.Query(ctx, "SELECT id, username, created_at FROM users")
	if err != nil {
		return nil, errors.Wrap(err, "[ListUsers] query failed")
	}
	defer rows.Close()

	var users []model.User
	for rows.Next() {
		var u model.User
		if err := rows.Scan(&u.ID, &u.Username, &u.CreatedAt); err != nil {
			return nil, errors.Wrap(err, "[ListUsers] row scan failed")
		}
		users = append(users, u)
	}
	if err := rows.Err(); err != nil {
		return nil, errors.Wrap(err, "[ListUsers] rows iteration error")
	}
	return users, nil
}

func (r *PostgresUserRepository) CreateUser(ctx context.Context, username string) (*model.User, error) {
	row := r.db.Pool.QueryRow(ctx,
		"INSERT INTO users (username) VALUES ($1) RETURNING id, username, created_at",
		username,
	)

	var u model.User
	if err := row.Scan(&u.ID, &u.Username, &u.CreatedAt); err != nil {
		return nil, errors.Wrapf(err,
			"[CreateUser] row scan failed (username=%s)", username)
	}
	return &u, nil
}
