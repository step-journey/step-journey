package repository

import (
	"context"
	"database/sql"
	"server/internal/db"
	"server/internal/model"

	"github.com/pkg/errors"
)

type PostgresUserRepository struct {
	db *db.DB
}

func NewPostgresUserRepository(dbConn *db.DB) *PostgresUserRepository {
	return &PostgresUserRepository{db: dbConn}
}

func (r *PostgresUserRepository) CreateUser(ctx context.Context, user *model.User) (*model.User, error) {
	row := r.db.Pool.QueryRow(ctx, `
		INSERT INTO users (oauth_provider, email, name, nickname, profile_image, role, visits_count)
		     VALUES ($1, $2, $3, $4, $5, $6, $7)
		 RETURNING id, created_at, updated_at
	`, user.OauthProvider, user.Email, user.Name, user.Nickname,
		user.ProfileImage, user.Role, user.VisitsCount)

	if err := row.Scan(&user.ID, &user.CreatedAt, &user.UpdatedAt); err != nil {
		return nil, errors.Wrap(err, "[CreateUser] insert scan fail")
	}
	return user, nil
}

func (r *PostgresUserRepository) FindByID(ctx context.Context, id int) (*model.User, error) {
	row := r.db.Pool.QueryRow(ctx, `
		SELECT id, oauth_provider, email, name, nickname, profile_image, 
		       role, visits_count, created_at, updated_at
		  FROM users
		 WHERE id = $1
	`, id)

	var u model.User
	err := row.Scan(&u.ID, &u.OauthProvider, &u.Email, &u.Name, &u.Nickname,
		&u.ProfileImage, &u.Role, &u.VisitsCount, &u.CreatedAt, &u.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, errors.Errorf("no user found with ID=%d", id)
	} else if err != nil {
		return nil, errors.Wrap(err, "[FindByID] queryRow scan fail")
	}
	return &u, nil
}

func (r *PostgresUserRepository) FindByEmail(ctx context.Context, email string) (*model.User, error) {
	row := r.db.Pool.QueryRow(ctx, `
		SELECT id, oauth_provider, email, name, nickname, profile_image, role, visits_count, created_at, updated_at
		  FROM users
		 WHERE email = $1
	`, email)

	var u model.User
	err := row.Scan(&u.ID, &u.OauthProvider, &u.Email, &u.Name, &u.Nickname, &u.ProfileImage,
		&u.Role, &u.VisitsCount, &u.CreatedAt, &u.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, err // 상위에서 err != nil 로 판단
	} else if err != nil {
		return nil, errors.Wrap(err, "[FindByEmail] queryRow scan fail")
	}
	return &u, nil
}

func (r *PostgresUserRepository) ListAllUsers(ctx context.Context) ([]model.User, error) {
	rows, err := r.db.Pool.Query(ctx, `
        SELECT id, oauth_provider, email, name, nickname, profile_image,
               role, visits_count, created_at, updated_at
          FROM users
        ORDER BY id
    `)
	if err != nil {
		return nil, errors.Wrap(err, "[ListAllUsers] query failed")
	}
	defer rows.Close()

	var results []model.User
	for rows.Next() {
		var u model.User
		if err := rows.Scan(&u.ID, &u.OauthProvider, &u.Email, &u.Name, &u.Nickname, &u.ProfileImage,
			&u.Role, &u.VisitsCount, &u.CreatedAt, &u.UpdatedAt); err != nil {
			return nil, errors.Wrap(err, "[ListAllUsers] row scan failed")
		}
		results = append(results, u)
	}
	if err := rows.Err(); err != nil {
		return nil, errors.Wrap(err, "[ListAllUsers] rows iteration error")
	}
	return results, nil
}

func (r *PostgresUserRepository) UpdateUser(ctx context.Context, user *model.User) error {
	_, err := r.db.Pool.Exec(ctx, `
		UPDATE users
		   SET oauth_provider=$2,
		       name=$3,
		       nickname=$4,
		       profile_image=$5,
		       role=$6,
		       visits_count=$7,
		       updated_at=NOW()
		 WHERE id=$1
	`,
		user.ID,
		user.OauthProvider,
		user.Name,
		user.Nickname,
		user.ProfileImage,
		user.Role,
		user.VisitsCount,
	)
	if err != nil {
		return errors.Wrap(err, "[UpdateUser] exec fail")
	}
	return nil
}
