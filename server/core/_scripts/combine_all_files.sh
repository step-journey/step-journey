#!/usr/bin/env bash
#
# 1) 현재 스크립트가 위치한 디렉토리(일반적으로 server/core/_scripts)에서
#    상위 디렉토리로 이동(server/core)
# 2) 프로젝트 구조(tree)와 특정 확장자들을 찾아,
#    server/core/_scripts/combined.txt 파일로 병합
#

set -e

##############################################
# 0) 스크립트가 위치한 디렉토리 기준으로 프로젝트 루트(server)로 이동
##############################################
cd "$(dirname "$0")/.."

##############################################
# 1) 결과를 저장할 파일 (server/core 기준)
##############################################
OUTPUT_FILE="_scripts/combined.txt"
CURRENT_DIR=$(basename "$(pwd)")

# 디렉토리 생성 & 이전 파일 삭제
mkdir -p "$(dirname "$OUTPUT_FILE")"
rm -f "$OUTPUT_FILE"

# 구현시 주의사항
echo "# StepJourney Golang Server 구현시 주의사항:" >> "$OUTPUT_FILE"
echo "- 너의 답변의 코드를 그대로 복사하여 붙여넣어서 prod 배포할 예정이므로 주석으로 생략하는 부분 없이 완전한 코드로 보여줘. 하지만 수정사항이 없는 파일의 코드는 보여주지마." >> "$OUTPUT_FILE"
echo "- 구현을 위해 조금이라도 수정이 된 파일은 해당 파일의 전체 코드를 완전하게 보여줘. 하지만 수정사항이 없는 파일의 코드는 보여주지마." >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

##############################################
# 2) 프로젝트 구조 출력
##############################################
echo "# Project Structure:" >> "$OUTPUT_FILE"
tree --charset=ASCII >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

##############################################
# 3) 프로젝트 기술 스택 출력
##############################################
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

##############################################
# 4) 코딩 원칙 삽입
##############################################
#echo "# Coding Principles:" >> "$OUTPUT_FILE"
#cat ./_scripts/CODING_RULES_FOR_PROMPT.md >> "$OUTPUT_FILE"
#echo "" >> "$OUTPUT_FILE"
#echo "" >> "$OUTPUT_FILE"

##############################################
# 5) 전체 프로젝트 소스코드 병합
##############################################
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
  # 상대 경로에서 "./"를 제거하고 앞에 "{CURRENT_DIR}/"를 붙임
  # 예: ./_scripts/migration.sh -> core/_scripts/migration.sh
  relative_path="$CURRENT_DIR/${file#./}"

  echo "### $relative_path:" >> "$OUTPUT_FILE"
  cat "$file" >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE"
done

##############################################
# 6) 마무리 안내
##############################################
echo "모든 파일이 $CURRENT_DIR/$OUTPUT_FILE 에 성공적으로 병합되었습니다."
