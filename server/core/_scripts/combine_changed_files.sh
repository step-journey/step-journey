#!/usr/bin/env bash
#
# 1) Git 루트(프로젝트 최상위)로 이동한다.
# 2) "커밋되지 않은(Tracked) 변경" 파일 목록을 얻는다(스테이징 + 비스테이징).
# 3) 그 중 server/core 폴더 내부(`server/core/`)에 있는 파일만 추려낸다.
# 4) 특정 확장자(Dockerfile, *.go 등)에 해당한다면
#    모두 합쳐서 server/core/_scripts/combined_changed.txt 에 저장한다.
# 5) 병합 전, server/core 디렉토리 구조와 간단한 프로젝트 정보를 파일 상단에 기록한다.
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

# 구현시 주의사항
echo "# StepJourney Golang Server 구현시 주의사항:" >> "$OUTPUT_FILE"
echo "- 너의 답변의 코드를 그대로 복사하여 붙여넣어서 prod 배포할 예정이므로 주석으로 생략하는 부분 없이 완전한 코드로 보여줘. 하지만 수정사항이 없는 파일의 코드는 보여주지마." >> "$OUTPUT_FILE"
echo "- 구현을 위해 조금이라도 수정이 된 파일은 해당 파일의 전체 코드를 완전하게 보여줘. 하지만 수정사항이 없는 파일의 코드는 보여주지마." >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

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
#echo "# Coding Principles:" >> "$OUTPUT_FILE"
#cat server/core/_scripts/CODING_RULES_FOR_PROMPT.md >> "$OUTPUT_FILE"
#echo "" >> "$OUTPUT_FILE"
#echo "" >> "$OUTPUT_FILE"

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
