#!/usr/bin/env bash
# todo 프로젝트 소개 추가
# 1) 현재 스크립트가 위치한 디렉토리(보통 client-web/script)에서
#    상위 디렉토리(client-web)로 이동.
# 2) node_modules, dist, .idea, package-lock.json, fonts 등의 디렉토리/파일을 제외하고
#    특정 확장자(.js, .ts, .css, .html, .json, .sh, 등)를 하나의 파일(script/combined.txt)로 병합.
# 3) 최종적으로 "script/combined.txt"에 모든 소스가 합쳐지고,
#    프로젝트 구조와 기술 스택 정보를 상단에 기록한다.
#

set -e

##############################################
# 0) 스크립트 위치 기준으로 상위 디렉토리(client-web)로 이동
##############################################
cd "$(dirname "$0")/.."

##############################################
# 1) 결과를 저장할 파일 (client-web 기준)
##############################################
OUTPUT_FILE="script/combined.txt"
CURRENT_DIR="$(basename "$(pwd)")"

# 기존 파일 삭제 & 디렉토리 생성
rm -f "$OUTPUT_FILE"
mkdir -p "$(dirname "$OUTPUT_FILE")"

# 구현시 주의사항
echo "# StepJourney React Client 구현시 주의사항:" >> "$OUTPUT_FILE"
echo "- 프로젝트 이름은 StepJourney 임" >> "$OUTPUT_FILE"
echo "- 너의 답변의 코드를 그대로 복사하여 붙여넣어서 prod 배포할 예정이므로 주석으로 생략하는 부분 없이 완전한 코드로 보여줘. 하지만 수정사항이 없는 파일의 코드는 보여주지마." >> "$OUTPUT_FILE"
echo "- 구현을 위해 조금이라도 수정이 된 파일은 해당 파일의 전체 코드를 완전하게 보여줘. 하지만 수정사항이 없는 파일의 코드는 보여주지마." >> "$OUTPUT_FILE"
echo "- 상태 관리: 서버로부터 받아오는 데이터(페칭·캐싱·동기화)는 React Query가 전담하고, 모달·로딩 등 클라이언트 전용 UI 상태는 Zustand와 컴포넌트 로컬 상태로 관리 해야함" >> "$OUTPUT_FILE"
echo "- React 클라이언트에서 UI 디자인은 shadcd/ui (\`radix-ui\`)가 추구하는 것처럼 minimal함을 추구해야함" >> "$OUTPUT_FILE"
echo "- React 클라이언트에서 필요한 컴포넌트를 \`npx shadcn@latest add [component]\` 커맨드로 추가해서 사용해야함" >> "$OUTPUT_FILE"
echo "- React 클라이언트에서 아이콘은 \`\"@tabler/icons-react\"\` 혹은 'lucide-react' 에서 적절한 것을 가져다가 사용해야함" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# 프로젝트 파일 구조 설명:
echo "# StepJourney React 프로젝트 파일 구조:" >> "$OUTPUT_FILE"
echo "- src/components/ui/ : 디자인 시스템 컴포넌트 ((shadcn/ui))" >> "$OUTPUT_FILE"
echo "- src/components/common/ : 전역에서 사용하는 공통 컴포넌트" >> "$OUTPUT_FILE"
echo "- src/constants/ : 전역적으로 공유되는 상수 관리" >> "$OUTPUT_FILE"
echo "- src/features/ : 도메인(기능) 기반으로 모듈화된 코드 관리" >> "$OUTPUT_FILE"
echo "- src/features/*/*.tsx : 각 도메인의 최상위 페이지 컴포넌트로 라우팅 진입점 역할" >> "$OUTPUT_FILE"
echo "- src/features/**/components/ : 특정 도메인에서만 사용되는 컴포넌트" >> "$OUTPUT_FILE"
echo "- src/features/**/hooks/ : 특정 도메인 전용 커스텀 훅" >> "$OUTPUT_FILE"
echo "- src/features/**/services/ : 특정 도메인의 API 호출 및 관련 서비스 로직" >> "$OUTPUT_FILE"
echo "- src/features/**/store/ : 특정 도메인의 상태 관리(Zustand)" >> "$OUTPUT_FILE"
echo "- src/features/**/types/ : 특정 도메인의 타입 정의" >> "$OUTPUT_FILE"
echo "- src/features/**/utils/ : 특정 도메인 전용 비즈니스 로직 관련 유틸 함수" >> "$OUTPUT_FILE"
echo "- src/hooks/ : 전역 커스텀 훅을 포함" >> "$OUTPUT_FILE"
echo "- src/lib/ : 외부 라이브러리를 확장하거나 자체적으로 공통으로 사용하는 라이브러리화된 유틸 함수" >> "$OUTPUT_FILE"
echo "- src/services/ : 전역에서 사용하는 서비스 로직(API 클라이언트, DB 연결 등)" >> "$OUTPUT_FILE"
echo "- src/store/ : 앱 전체적으로 공유되는 전역 상태 관리" >> "$OUTPUT_FILE"
echo "- src/types/ : 프로젝트 전역 공통 타입 정의" >> "$OUTPUT_FILE"
echo "- src/utils/ : 프로젝트 전반에 걸쳐 사용하는 범용 유틸리티 함수 및 공통 로직" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

##############################################
# 프로젝트 기술 스택 출력
##############################################
echo "# Project Tech stack:" >> "$OUTPUT_FILE"
echo "- React" >> "$OUTPUT_FILE"
echo "- Vite" >> "$OUTPUT_FILE"
echo "- TypeScript" >> "$OUTPUT_FILE"
echo "- zustand" >> "$OUTPUT_FILE"
echo "- tanstack/react-query" >> "$OUTPUT_FILE"
echo "- Tailwind CSS" >> "$OUTPUT_FILE"
echo "- shadcn/ui" >> "$OUTPUT_FILE"
echo "- radix-ui" >> "$OUTPUT_FILE"
echo "- tabler/icons-react" >> "$OUTPUT_FILE"
echo "- lucide-react" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

##############################################
# 프로젝트 구조(tree) 출력
##############################################
echo "# Project Structure:" >> "$OUTPUT_FILE"
tree . --charset=ASCII -I "node_modules|dist|.idea|package-lock.json|fonts" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

##############################################
# 4) 전체 소스코드 병합
##############################################
echo "# Full Project Source Code:" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# 한 번의 find 로 필요한 확장자만 검색
find . \
  \( -name "*.js" \
     -o -name "*.jsx" \
     -o -name "*.ts" \
     -o -name "*.tsx" \
     -o -name "*.yml" \
     -o -name "*.css" \
     -o -name "*.html" \
     -o -name "*.json" \
     -o -name "*.sh" \) \
  -type f \
  ! -path "*/node_modules/*" \
  ! -path "*/dist/*" \
  ! -path "*/.idea/*" \
  ! -path "*/fonts/*" \
  ! -path "*/script/*" \
  ! -name "package-lock.json" \
  | sort \
  | while read -r file
do
  # file 에서 "./" 제거 후 "client-web/" 형태로 상대 경로 표현
  relative_path="$CURRENT_DIR/${file#./}"

  echo "# $relative_path:" >> "$OUTPUT_FILE"
  cat "$file" >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE"
done

##############################################
# 5) 마무리 안내
##############################################
echo "모든 파일이 $CURRENT_DIR/$OUTPUT_FILE 에 성공적으로 병합되었습니다."
