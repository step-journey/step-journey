package serve

import (
	"context"
	"errors"
	"net/http"
	"os"
	"os/signal"
	"server/internal/config"
	"server/internal/db"
	"server/internal/flags"
	"server/internal/handler"
	"server/internal/repository"
	"server/internal/service"
	"syscall"
	"time"

	pkgerrors "github.com/pkg/errors"
	"github.com/rs/zerolog/log"
	"github.com/urfave/cli/v2"
)

const shutdownTimeout = 30 * time.Second

type Server struct {
	httpServer *http.Server
	db         *db.DB
	// gRPC, WebSocket, MQ listener...
	shutdownTimeout time.Duration
}

func NewCommand() *cli.Command {
	return &cli.Command{
		Name:   "serve",
		Usage:  "Start HTTP server",
		Action: runServer,
	}
}

func runServer(c *cli.Context) error {
	envName := os.Getenv(flags.EnvVarEnvironment)
	cfgFile := c.String(flags.FlagConfig)
	// Load config
	cfg, err := config.LoadConfig(cfgFile, envName)
	if err != nil {
		return pkgerrors.Wrapf(err, "[runServer] LoadConfig failed (file=%s, env=%s)", cfgFile, envName)
	}

	// DB 연결
	dbCfg, err := cfg.ToDBConfig()
	if err != nil {
		return pkgerrors.Wrap(err, "[runServer] ToDBConfig failed")
	}
	connStr := config.GetDBConnString(dbCfg)
	dbConn, err := db.NewDB(
		dbCfg.Host,
		dbCfg.Port,
		dbCfg.User,
		dbCfg.Password,
		dbCfg.DBName,
		dbCfg.SSLMode,
	)
	if err != nil {
		return pkgerrors.Wrapf(err, "[runServer] NewDB failed (host=%s port=%d user=%s db=%s)",
			dbCfg.Host, dbCfg.Port, dbCfg.User, dbCfg.DBName)
	}

	// 자동 마이그레이션
	if err := db.MigrateDB(connStr, "up"); err != nil {
		return pkgerrors.Wrapf(err, "[runServer] failed to auto-migrate on server start")
	}

	// 리포지토리 생성
	userRepo := repository.NewPostgresUserRepository(dbConn)
	userSvc := service.NewUserService(userRepo)

	userHandler := handler.NewUserHandler(userSvc)
	healthHandler := handler.NewHealthHandler()

	mux := http.NewServeMux()
	mux.Handle("/health", healthHandler)
	mux.Handle("/", userHandler)

	// HTTP 서버 생성
	httpSrv := config.NewServer(
		cfg.Server.Port,
		mux,
		cfg.ServerReadTimeout(),
		cfg.ServerWriteTimeout(),
	)

	// Server 구조체 초기화
	srv := &Server{
		httpServer:      httpSrv,
		db:              dbConn,
		shutdownTimeout: shutdownTimeout,
	}

	// 종료 처리
	srv.setupGracefulShutdown()

	// 메인 쓰레드 차단하며 서버 실행
	log.Info().
		Int("port", cfg.Server.Port).
		Dur("read_timeout", cfg.ServerReadTimeout()).
		Dur("write_timeout", cfg.ServerWriteTimeout()).
		Msg("[runServer] Starting HTTP server...")

	if err := srv.httpServer.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		return pkgerrors.Wrap(err, "[runServer] server failed to start or crashed")
	}

	// 정상 종료
	log.Info().Msg("[runServer] HTTP server has stopped gracefully")
	return nil
}

func (s *Server) setupGracefulShutdown() {
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh,
		syscall.SIGINT,  // Ctrl+C
		syscall.SIGTERM, // kill
		syscall.SIGQUIT, // Ctrl+\
	)

	go func() {
		sig := <-sigCh
		log.Info().Msgf("[setupGracefulShutdown] Received shutdown signal: %s", sig.String())

		if err := s.gracefulShutdown(); err != nil {
			log.Error().Err(err).Msg("[setupGracefulShutdown] Shutdown error")
			os.Exit(1)
		}
		os.Exit(0)
	}()
}

func (s *Server) gracefulShutdown() error {
	// 컨텍스트 생성: 30초가 지나도 종료가 안 되면 컨텍스트 타임아웃 발생으로 강제 종료 → 무한 대기 방지
	ctx, cancel := context.WithTimeout(context.Background(), s.shutdownTimeout)
	defer cancel()

	log.Info().Msg("[gracefulShutdown] Initiating graceful shutdown...")

	// HTTP 서버 종료 (리스너 즉시 닫아 새로운 요청 즉시 차단, 이미 진행 중인 요청은 계속 처리)
	if err := s.httpServer.Shutdown(ctx); err != nil {
		return pkgerrors.Wrap(err, "[gracefulShutdown] failed to shutdown HTTP server")
	}

	// DB 커넥션 종료
	if s.db != nil {
		s.db.Close()
		log.Info().Msg("[gracefulShutdown] Database connection closed")
	}

	log.Info().Msg("[gracefulShutdown] Graceful shutdown completed")
	return nil
}
