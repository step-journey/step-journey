#!/usr/bin/env bash

# 예시: golang-migrate CLI를 통해 마이그레이션을 실행하는 스크립트

# 사용 예: ./scripts/migration.sh up
#        ./scripts/migration.sh down

DIRECTION=$1
if [ -z "$DIRECTION" ]; then
  echo "Usage: $0 [up|down]"
  exit 1
fi

# 실제 DB 접속 정보는 환경변수 등에서 가져오거나, 아래처럼 직접 작성
DB_URL="postgres://postgres:postgres@localhost:5432/myapp_db?sslmode=disable"
MIGRATIONS_DIR="./migrations"

# golang-migrate 명령어 (migrate CLI 설치 필요)
migrate -path "$MIGRATIONS_DIR" -database "$DB_URL" "$DIRECTION"
