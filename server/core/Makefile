.PHONY: all build run test migrate-up migrate-down sqlc

all: dev-run

dev-run: build
	@echo "[Makefile] Build done. Now running..."
	ENVIRONMENT=local ./bin/step-journey --env=local serve

build:
	@echo "[Makefile] Building..."
	go build -o bin/step-journey ./cmd/api

run:
	@echo "[Makefile] Running..."
	ENVIRONMENT=local ./bin/step-journey --env=local serve

test:
	@echo "[Makefile] Testing..."
	go test -v ./...

sqlc:
	@echo "[Makefile] Generating sqlc code..."
	sqlc generate

migrate-up:
	@echo "[Makefile] Migrate up..."
	go run ./cmd/api/main.go migrate up

migrate-down:
	@echo "[Makefile] Migrate down..."
	go run ./cmd/api/main.go migrate down
