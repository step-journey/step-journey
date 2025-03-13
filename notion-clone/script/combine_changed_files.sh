#!/usr/bin/env bash
#
# 1) Git 루트(프로젝트 최상위)로 이동한다.
# 2) "커밋되지 않은(Tracked) 변경" 파일 목록을 얻는다(스테이징 + 비스테이징).
# 3) 그 중 notion-clone 폴더 내부(`notion-clone/`)에 있는 파일만 추려낸다.
# 4) 특정 확장자(.js, .ts, .json, .sh, .html, .css, .yml 등)에 해당한다면
#    모두 합쳐서 notion-clone/script/combined_changed.txt 에 저장한다.
# 5) 병합 전, notion-clone 디렉토리 구조와 간단한 프로젝트 정보를 파일 상단에 기록한다.
#

set -e

##############################################
# 0) Git 루트로 이동
##############################################
PROJECT_ROOT="$(git rev-parse --show-toplevel)"
cd "$PROJECT_ROOT"

##############################################
# 결과를 저장할 파일 (루트 기준)
##############################################
OUTPUT_FILE="notion-clone/script/combined_changed.txt"

# 디렉토리 생성 & 기존 파일 삭제
mkdir -p "$(dirname "$OUTPUT_FILE")"
rm -f "$OUTPUT_FILE"

# 구현시 주의사항
#echo "# StepJourney React Client 구현시 주의사항:" >> "$OUTPUT_FILE"
#echo "- 너의 답변의 코드를 그대로 복사하여 붙여넣어서 prod 배포할 예정이므로 주석으로 생략하는 부분 없이 완전한 코드로 보여줘. 하지만 수정사항이 없는 파일의 코드는 보여주지마." >> "$OUTPUT_FILE"
#echo "- 구현을 위해 조금이라도 수정이 된 파일은 해당 파일의 전체 코드를 완전하게 보여줘. 하지만 수정사항이 없는 파일의 코드는 보여주지마." >> "$OUTPUT_FILE"
#echo "- 상태 관리: 서버로부터 받아오는 데이터(페칭·캐싱·동기화)는 React Query가 전담하고, 모달·로딩 등 클라이언트 전용 UI 상태는 Zustand와 컴포넌트 로컬 상태로 관리 해야함" >> "$OUTPUT_FILE"
#echo "- React 클라이언트에서 UI 디자인은 shadcd/ui (\`radix-ui\`)가 추구하는 것처럼 minimal함을 추구해야함" >> "$OUTPUT_FILE"
#echo "- React 클라이언트에서 필요한 컴포넌트를 \`npx shadcn@latest add [component]\` 커맨드로 추가해서 사용해야함" >> "$OUTPUT_FILE"
#echo "- React 클라이언트에서 아이콘은 \`\"@tabler/icons-react\"\` 혹은 'lucide-react' 에서 적절한 것을 가져다가 사용해야함" >> "$OUTPUT_FILE"
#echo "" >> "$OUTPUT_FILE"

# 상태 관리 방법:
#echo "# StepJourney React 프로젝트 상태 관리 방법:" >> "$OUTPUT_FILE"
#echo "### 데이터의 출처와 목적에 따른 결정:" >> "$OUTPUT_FILE"
#echo "- 서버 데이터: React Query" >> "$OUTPUT_FILE"
#echo "- 클라이언트 전용 상태: Zustand" >> "$OUTPUT_FILE"
#echo "### 상태의 범위에 따른 결정:" >> "$OUTPUT_FILE"
#echo "- 앱 전체: Zustand (루트 스토어)" >> "$OUTPUT_FILE"
#echo "- 기능/페이지 범위: Zustand (도메인별 스토어)" >> "$OUTPUT_FILE"
#echo "- 컴포넌트 범위: useState" >> "$OUTPUT_FILE"
#echo "" >> "$OUTPUT_FILE"

##############################################
# 프로젝트 기술 스택 출력
##############################################
#echo "# Project Tech stack:" >> "$OUTPUT_FILE"
#echo "- React" >> "$OUTPUT_FILE"
#echo "- Vite" >> "$OUTPUT_FILE"
#echo "- TypeScript" >> "$OUTPUT_FILE"
#echo "- zustand" >> "$OUTPUT_FILE"
#echo "- tanstack/react-query" >> "$OUTPUT_FILE"
#echo "- Tailwind CSS" >> "$OUTPUT_FILE"
#echo "- shadcn/ui" >> "$OUTPUT_FILE"
#echo "- radix-ui" >> "$OUTPUT_FILE"
#echo "- tabler/icons-react" >> "$OUTPUT_FILE"
#echo "" >> "$OUTPUT_FILE"


##############################################
# notion-clone 디렉토리 구조 출력
##############################################
#echo "# Project Structure (notion-clone only):" >> "$OUTPUT_FILE"
#tree notion-clone --charset=ASCII -I "node_modules|dist|.idea|package-lock.json|fonts" >> "$OUTPUT_FILE"
#echo "" >> "$OUTPUT_FILE"

##############################################
# "커밋되지 않은 (Tracked) 변경 파일" 수집
##############################################
echo "# Changed (Uncommitted) Source Code in notion-clone:" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Git pager 비활성화
export GIT_PAGER=cat

# 4-1) 스테이징된 변경 (Tracked) - notion-clone 범위
STAGED=$(git diff --cached --name-only HEAD -- notion-clone)

# 4-2) 스테이징 안 된 변경 (Tracked) - notion-clone 범위
UNSTAGED=$(git diff --name-only HEAD -- notion-clone)

# 4-3) 합쳐서 중복 제거
CHANGED_UNCOMMITTED_FILES=$( (echo "$STAGED"; echo "$UNSTAGED") | sort -u )

##############################################
# 5) 파일 내용 병합
##############################################
for file in $CHANGED_UNCOMMITTED_FILES
do
  # 5-1) 혹시 삭제되었거나 디렉토리이면 건너뛰기
  [ -f "$file" ] || continue

  # 5-2) notion-clone/ 내부인지 확인 (중복 안전장치)
  [[ $file == notion-clone/* ]] || continue

  # 5-3) 제외 파일
  if [[ "$file" = "notion-clone/package-lock.json" || "$file" == notion-clone/script/* ]]; then
    continue
  fi

  # 5-4) 확장자 필터 (js, jsx, ts, tsx, css, html, yml, json, sh 등)
  case "$file" in
    *.js|*.jsx|*.ts|*.tsx|*.css|*.html|*.yml|*.yaml|*.json|*.sh)
      echo "### $file:" >> "$OUTPUT_FILE"
      cat "$file" >> "$OUTPUT_FILE"
      echo "" >> "$OUTPUT_FILE"
      ;;
    *)
      # 그 외 확장자는 무시
      ;;
  esac
done

##############################################
# 6) 안내 메시지
##############################################
echo "모든 변경된(Tracked) 파일 중 notion-clone/ 내부 파일만 '$OUTPUT_FILE' 에 성공적으로 병합되었습니다."
