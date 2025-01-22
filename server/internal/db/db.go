package db

import (
	"context"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/pkg/errors"
	"github.com/rs/zerolog/log"
)

type DB struct {
	Pool *pgxpool.Pool
}

func NewDB(connString string) (*DB, error) {
	pool, err := pgxpool.New(context.Background(), connString)
	if err != nil {
		return nil, errors.Wrapf(err,
			"[NewDB] pgxpool.New failed (connString=%s)", connString)
	}

	if err := pool.Ping(context.Background()); err != nil {
		return nil, errors.Wrapf(err,
			"[NewDB] Ping failed (connString=%s)", connString)
	}

	log.Info().Msg("[NewDB] DB connection established")
	return &DB{Pool: pool}, nil
}

func (db *DB) Close() {
	db.Pool.Close()
}

func MigrateDB(connStr, migrationsDir, direction string) error {
	m, err := migrate.New("file://"+migrationsDir, connStr)
	if err != nil {
		return errors.Wrapf(err,
			"[MigrateDB] migrate.New failed (dir=%s, connStr=%s)", migrationsDir, connStr)
	}

	switch direction {
	case "up":
		err = m.Up()
	case "down":
		err = m.Down()
	default:
		return errors.Errorf("[MigrateDB] unknown migration direction: %s", direction)
	}

	if err != nil && err != migrate.ErrNoChange {
		return errors.Wrapf(err,
			"[MigrateDB] failed to migrate %s (dir=%s, connStr=%s)", direction, migrationsDir, connStr)
	}

	log.Info().Msgf("[MigrateDB] Database migrated %s successfully", direction)
	return nil
}
