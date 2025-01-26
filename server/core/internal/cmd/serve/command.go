package serve

import (
	"context"
	"errors"
	"net/http"
	"os"
	"os/signal"
	"server/internal/repository"
	"syscall"
	"time"

	pkgerrors "github.com/pkg/errors"
	"github.com/rs/zerolog/log"
	"github.com/urfave/cli/v2"

	"server/internal/config"
	"server/internal/db"
	"server/internal/flags"
	"server/internal/handler"
	"server/internal/service"
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
	// 환경, 설정 파일 로드
	envName := c.String(flags.FlagEnv)
	cfgFile := c.String(flags.FlagConfig)
	envFile := c.String(flags.FlagEnvFile)

	cfg, err := config.LoadConfig(cfgFile, envName, envFile)
	if err != nil {
		return pkgerrors.Wrapf(err,
			"[runServer] LoadConfig failed (file=%s, env=%s, envFile=%s)",
			cfgFile, envName, envFile)
	}

	// DB 연결
	connStr := config.GetDBConnString(cfg.ToDBConfig())
	dbConn, err := db.NewDB(connStr)
	if err != nil {
		return pkgerrors.Wrapf(err,
			"[runServer] NewDB failed (connStr=%s)", connStr)
	}

	// 자동 마이그레이션
	if err := db.MigrateDB(connStr, "migrations", "up"); err != nil {
		return pkgerrors.Wrapf(err, "[runServer] failed to auto-migrate on server start")
	}

	// 리포지토리 생성
	userRepo := repository.NewPostgresUserRepository(dbConn)

	// Service / Handler 준비
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

	// 메인 쓰레드를 차단하며 서버 실행
	if err := srv.httpServer.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		return pkgerrors.Wrap(err, "[runServer] server failed to start or crashed")
	}

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
