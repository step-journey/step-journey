#!/usr/bin/env bash
#
# 1) Git 루트로 이동하여, "커밋되지 않은(Tracked) 변경"을 가져온다.
# 2) 그중 client-web/ 내부 파일만 필터링한다.
# 3) diff에서 실제 추가(+)된 코드 라인만 추출해, client-web/script/combined_added_lines.txt 에 모은다.
#    (즉, -로 제거된 라인이나 diff 헤더/메타 정보(+++ 등)는 제외)
#

set -e

##############################################
# 0) Git 루트로 이동
##############################################
PROJECT_ROOT="$(git rev-parse --show-toplevel)"
cd "$PROJECT_ROOT"

##############################################
# 1) 결과를 저장할 파일 (루트 기준)
##############################################
OUTPUT_FILE="client-web/script/combined_added_lines.txt"

# 디렉토리 생성 & 이전 파일 삭제
mkdir -p "$(dirname "$OUTPUT_FILE")"
rm -f "$OUTPUT_FILE"

# 구현시 주의사항
echo "# StepJourney React Client 구현시 주의사항:" >> "$OUTPUT_FILE"
echo "- 너의 답변의 코드를 그대로 복사하여 붙여넣어서 prod 배포할 예정이므로 주석으로 생략하는 부분 없이 완전한 코드로 보여줘. 하지만 수정사항이 없는 파일의 코드는 보여주지마." >> "$OUTPUT_FILE"
echo "- 구현을 위해 조금이라도 수정이 된 파일은 해당 파일의 전체 코드를 완전하게 보여줘. 하지만 수정사항이 없는 파일의 코드는 보여주지마." >> "$OUTPUT_FILE"
echo "- React 클라이언트에서 UI 디자인은 shadcd/ui (\`radix-ui\`)가 추구하는 것처럼 minimal함을 추구해야함" >> "$OUTPUT_FILE"
echo "- React 클라이언트에서 필요한 컴포넌트를 \`npx shadcn@latest add [component]\` 커맨드로 추가해서 사용해야함" >> "$OUTPUT_FILE"
echo "- React 클라이언트에서 아이콘은 \`\"@tabler/icons-react\"\` 에서 적절한 것을 가져다가 사용해야함" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

##############################################
# 2) (선택) client-web 트리 구조, 기술스택 등 정보 출력
##############################################
echo "# Project Structure (client-web only):" >> "$OUTPUT_FILE"
tree client-web --charset=ASCII -I "node_modules|dist|.idea|package-lock.json|fonts" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

echo "# Added Lines (Uncommitted Changes in client-web):" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

##############################################
# 3) Git pager 비활성화
##############################################
export GIT_PAGER=cat

##############################################
# 4) 변경된 파일 목록(Tracked) 중 client-web 안에 있는 것만 추출
##############################################
STAGED=$(git diff --cached --name-only HEAD -- client-web)
UNSTAGED=$(git diff --name-only HEAD -- client-web)

CHANGED_FILES=$( (echo "$STAGED"; echo "$UNSTAGED") | sort -u )

##############################################
# 5) 파일별로 "추가된 라인(+)"만 추출해서 병합
##############################################
for file in $CHANGED_FILES
do
  # 5-1) 파일 존재 여부 확인 (삭제된 파일 등 제외)
  [ -f "$file" ] || continue

  # 5-2) client-web 내부인지 재확인 (안전장치)
  [[ $file == client-web/* ]] || continue

  # (스테이징 + 미스테이징) diff를 모두 합쳐서 실제 추가된(+ 라인)만 추출
  DIFF_LINES=$(
    (
      git diff --cached HEAD -- "$file"
      git diff HEAD -- "$file"
    ) \
    | grep -E '^\+[^\+]'  # 맨 앞에 '+'이고, 두 번째 문자가 '+' 아닌 라인만 (+++ 등은 제외)
  )

  # 추가된 라인이 없다면 스킵
  if [ -z "$DIFF_LINES" ]; then
    continue
  fi

  # 구분자 & 추가 라인 출력
  echo "### $file:" >> "$OUTPUT_FILE"
  echo "$DIFF_LINES" >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE"
done

##############################################
# 6) 마무리 안내
##############################################
echo "추가된(+) 코드 라인들이 '$OUTPUT_FILE' 에 성공적으로 병합되었습니다."
