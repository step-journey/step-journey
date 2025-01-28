#!/usr/bin/env bash
#
# 목적:
# 1) Git 루트로 이동하여, "커밋되지 않은(Tracked) 변경"을 가져온다.
# 2) 그중 server/core/ 내부 파일만 필터링한다.
# 3) diff에서 실제 추가(+)된 코드 라인만 추출해, server/core/_scripts/combined_added_lines.txt 에 모은다.
#    (즉, -로 제거된 라인이나 diff 헤더/메타 정보는 제외)
#

set -e

##############################################
# 0) Git 루트로 이동
##############################################
PROJECT_ROOT="$(git rev-parse --show-toplevel)"
cd "$PROJECT_ROOT"

##############################################
# 1) 결과를 저장할 파일 경로 (루트 기준)
##############################################
OUTPUT_FILE="server/core/_scripts/combined_added_lines.txt"

# 디렉토리 생성 & 이전 파일 삭제
mkdir -p "$(dirname "$OUTPUT_FILE")"
rm -f "$OUTPUT_FILE"

##############################################
# 2) (선택) server/core 트리 구조 등 정보 출력
##############################################
echo "# Project Structure (server/core only):" >> "$OUTPUT_FILE"
tree server/core --charset=ASCII >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

echo "# Added Lines (Uncommitted Changes in server/core):" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

##############################################
# 3) Git pager 비활성화
##############################################
export GIT_PAGER=cat

##############################################
# 4) 변경된 파일 목록(Tracked) 중 server/core 안에 있는 것만 추출
##############################################
STAGED=$(git diff --cached --name-only HEAD -- server/core)
UNSTAGED=$(git diff --name-only HEAD -- server/core)

CHANGED_FILES=$( (echo "$STAGED"; echo "$UNSTAGED") | sort -u )

##############################################
# 5) 파일별로 "추가된 라인(+)"만 추출해서 병합
##############################################
for file in $CHANGED_FILES
do
  # 파일이 실제 존재하는지(삭제된 상태가 아닌지) 확인
  [ -f "$file" ] || continue

  # 각 파일에 대해, (스테이징 + 비스테이징) diff를 합쳐 새 라인만 추출
  DIFF_LINES=$(
    (
      git diff --cached HEAD -- "$file"
      git diff HEAD -- "$file"
    ) \
    | grep -E '^\+[^\+]'  # 맨 앞이 '+'이고, 두 번째 문자가 '+'가 아닌 라인만(즉 '+++', '++...'는 제외)
  )

  # 실제로 추가된 라인이 없다면 스킵
  if [ -z "$DIFF_LINES" ]; then
    continue
  fi

  # 구분자와 함께 추가된 라인을 파일별로 출력
  echo "### $file:" >> "$OUTPUT_FILE"
  echo "$DIFF_LINES" >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE"
done

##############################################
# 6) 마무리 안내
##############################################
echo "추가된(+) 코드 라인들이 '$OUTPUT_FILE' 에 성공적으로 병합되었습니다."
