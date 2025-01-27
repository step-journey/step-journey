package db

import (
	"context"
	"path/filepath"
	"strconv"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/pgx"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/pkg/errors"
	"github.com/rs/zerolog/log"
)

type DB struct {
	Pool *pgxpool.Pool
}

func NewDB(host string, port int, user, pass, dbName, sslMode string) (*DB, error) {
	// DSN 없이 pgxpool.Config 를 직접 만들어, 환경변수 간섭 제거
	cfg, err := pgxpool.ParseConfig("")
	if err != nil {
		return nil, errors.Wrap(err, "[NewDB] ParseConfig failed")
	}

	// 필드 직접 설정
	cfg.ConnConfig.Host = host
	cfg.ConnConfig.Port = uint16(port)
	cfg.ConnConfig.User = user
	cfg.ConnConfig.Password = pass
	cfg.ConnConfig.Database = dbName

	if sslMode == "disable" {
		cfg.ConnConfig.TLSConfig = nil
	}

	cfg.MaxConns = 10

	pool, err := pgxpool.NewWithConfig(context.Background(), cfg)
	if err != nil {
		return nil, errors.Wrapf(err,
			"[NewDB] pgxpool.NewWithConfig failed (host=%s port=%d db=%s user=%s)",
			host, port, dbName, user)
	}

	if err := pool.Ping(context.Background()); err != nil {
		return nil, errors.Wrapf(err,
			"[NewDB] Ping failed (host=%s port=%d db=%s user=%s)",
			host, port, dbName, user)
	}

	log.Info().
		Str("host", host).
		Str("port", strconv.Itoa(port)).
		Str("user", user).
		Str("db", dbName).
		Msg("[NewDB] DB connection established by pgxpool.NewWithConfig")

	return &DB{Pool: pool}, nil
}

func (db *DB) Close() {
	db.Pool.Close()
}

func MigrateDB(connStr, direction string) error {
	absPath, err := filepath.Abs("migrations")
	if err != nil {
		return errors.Wrap(err, "[MigrateDB] failed to get abs path")
	}

	m, err := migrate.New("file://"+absPath, connStr)
	if err != nil {
		return errors.Wrapf(err,
			"[MigrateDB] migrate.New failed (dir=%s, connStr=%s)", absPath, connStr)
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
			"[MigrateDB] failed to migrate %s (dir=%s, connStr=%s)", direction, absPath, connStr)
	}

	version, dirty, verErr := m.Version()
	if verErr != nil && verErr != migrate.ErrNilVersion {
		log.Warn().Msgf("[MigrateDB] Could not fetch version after migration: %v", verErr)
	}

	log.Info().
		Str("direction", direction).
		Uint("version", version).
		Bool("dirty", dirty).
		Msg("[MigrateDB] Database migration completed")

	return nil
}
