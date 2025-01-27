.PHONY: all build run test migrate-up migrate-down sqlc \
        docker-up docker-down docker-restart dev-run

all: dev-run

docker-up:
	@echo "[Makefile] Starting docker-compose..."
	docker-compose up -d

docker-down:
	@echo "[Makefile] Stopping docker-compose..."
	docker-compose down

docker-restart: docker-down docker-up

dev-run: docker-up build
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
