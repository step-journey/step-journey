#!/usr/bin/env bash
#
# 이 스크립트는 실제 .git 이 있는 프로젝트 루트(예: packet-journey)로 이동한 뒤,
# "커밋되지 않은 (Tracked) 변경 파일" 중 server/core/ 내부에 있는 파일만 하나의 파일로 합쳐
# server/core/_scripts/combined_changed.txt 에 생성합니다.
# 프로젝트 구조 출력 시에는 server/core 디렉토리만 tree 를 사용합니다.
#

set -e

##############################################
# 1) Git 최상위 경로를 동적으로 인식하여 이동
##############################################
PROJECT_ROOT="$(git rev-parse --show-toplevel)"
cd "$PROJECT_ROOT"

##############################################
# 2) 결과를 저장할 파일 지정 (루트 기준 경로)
##############################################
OUTPUT_FILE="server/core/_scripts/combined_changed.txt"

# 결과 파일이 들어갈 디렉토리 생성 & 기존 파일 삭제
mkdir -p "$(dirname "$OUTPUT_FILE")"
rm -f "$OUTPUT_FILE"

##############################################
# 3) server/core 디렉토리 구조만 출력
##############################################
echo "# Project Structure:" >> "$OUTPUT_FILE"
tree server/core --charset=ASCII >> "$OUTPUT_FILE"  # server/core만
echo "" >> "$OUTPUT_FILE"

##############################################
# 4) 프로젝트 기술 스택 출력
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
# 5) 코딩 원칙 삽입
##############################################
echo "# Coding Principles:" >> "$OUTPUT_FILE"
cat server/core/_scripts/CODING_RULES_FOR_PROMPT.md >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

##############################################
# 6) "커밋되지 않은 (Tracked) 변경 파일" 수집
##############################################
echo "# Changed (Uncommitted) Source Code:" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Git pager 비활성화
export GIT_PAGER=cat

# (1) 스테이징된 변경 (Tracked)
STAGED=$(git diff --cached --name-only HEAD -- server/core)

# (2) 스테이징 안 된 변경 (Tracked)
UNSTAGED=$(git diff --name-only HEAD -- server/core)

# 합쳐서 중복 제거
CHANGED_UNCOMMITTED_FILES=$( (echo "$STAGED"; echo "$UNSTAGED") | sort -u )

##############################################
# 7) 파일 내용 병합
##############################################
for file in $CHANGED_UNCOMMITTED_FILES
do
  # 7-1) 혹시 삭제되었거나 디렉토리일 경우 건너뛰기
  [ -f "$file" ] || continue

  # 7-2) server/core/ 내부가 아니면 건너뛴다
  [[ $file == server/core/* ]] || continue

  # 7-3) 확장자/파일명 필터
  case "$file" in
    *.go|*.sh|*.sql|*.yaml|*.yml|go.mod|Dockerfile|Makefile)
      echo "### $file:" >> "$OUTPUT_FILE"
      cat "$file" >> "$OUTPUT_FILE"
      echo "" >> "$OUTPUT_FILE"
      ;;
    *)
      # 그 외는 무시
      ;;
  esac
done

##############################################
# 8) 안내 메시지
##############################################
echo "모든 변경된(Tracked) 파일 중 server/core/ 내부 파일만 '$OUTPUT_FILE' 에 성공적으로 병합되었습니다."
