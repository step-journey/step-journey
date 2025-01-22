.PHONY: all build run test migrate-up migrate-down sqlc

all: dev-run

dev-run: build
	@echo "[Makefile] Build done. Now running..."
	./bin/step-journey serve

build:
	@echo "[Makefile] Building..."
	go build -o bin/step-journey ./cmd/api

run:
	@echo "[Makefile] Running..."
	./bin/step-journey serve

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
