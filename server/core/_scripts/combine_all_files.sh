#!/usr/bin/env bash
#
# 이 스크립트는 packet-journey/server/_scripts 디렉토리에 위치한다고 가정
# 실행 시, 프로젝트 루트(../)로 이동한 뒤 tree 구조와 특정 확장자의 파일들을
# 하나의 파일로 합쳐서 server 디렉토리에 생성함
#

set -e

# 스크립트가 위치한 디렉토리 기준으로 프로젝트 루트(server)로 이동
cd "$(dirname "$0")/.."

OUTPUT_FILE="_scripts/combined.txt"
CURRENT_DIR=$(basename $(pwd))

mkdir -p "$(dirname "$OUTPUT_FILE")"

# 기존 파일이 있다면 삭제
rm -f "$OUTPUT_FILE"

# 프로젝트 구조(tree) 출력
echo "# Project Structure:" >> "$OUTPUT_FILE"
tree --charset=ASCII >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# 프로젝트 기술 스택 출력
echo "# Project Tech stack:" >> "$OUTPUT_FILE"
echo "- go 1.23.5" >> "$OUTPUT_FILE"
echo "- net/http" >> "$OUTPUT_FILE"
echo "- github.com/pkg/errors" >> "$OUTPUT_FILE"
echo "- github.com/knadh/koanf" >> "$OUTPUT_FILE"
echo "- github.com/urfave/cli" >> "$OUTPUT_FILE"
echo "- github.com/jackc/pgx" >> "$OUTPUT_FILE"
echo "- github.com/golang-migrate/migrate" >> "$OUTPUT_FILE"
echo "- github.com/sqlc-dev/sqlc" >> "$OUTPUT_FILE"
echo "- github.com/Masterminds/squirrel" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# 코딩 원칙 삽입
echo "# Coding Principles:" >> "$OUTPUT_FILE"
cat ./_scripts/CODING_RULES_FOR_PROMPT.md >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Full Project Source Code 출력
echo "# Full Project Source Code:" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# 조건에 맞는 파일들을 모두 찾음
find . \
  \( -name "*.go" \
  -o -name "go.mod" \
  -o -name "*.sh" \
  -o -name "*.sql" \
  -o -name "*.yaml" \
  -o -name "*.yml" \
  -o -name "Dockerfile" \
  -o -name "Makefile" \) \
  -type f | sort | while read -r file
do
  # 상대 경로에서 "./"를 제거하고 앞에 "server/"를 붙임
  # 예: ./_scripts/migration.sh -> server/_scripts/migration.sh

  relative_path="$CURRENT_DIR/${file#./}"

  echo "### $relative_path:" >> "$OUTPUT_FILE"
  cat "$file" >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE"
done

echo "모든 파일이 $CURRENT_DIR/$OUTPUT_FILE 에 성공적으로 병합되었습니다."