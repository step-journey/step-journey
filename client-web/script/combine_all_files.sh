#!/usr/bin/env bash

set -e

##############################################
# 0) 스크립트 위치 기준으로 상위 디렉토리(client-web)로 이동
##############################################
cd "$(dirname "$0")/.."

##############################################
# 1) 결과를 저장할 파일들 (client-web 기준)
##############################################
INFO_FILE="script/combined_all_1_project_info.txt"
STRUCTURE_FILE="script/combined_all_2_project_structure.txt"
CODE_FILE="script/combined_all_3_code.txt"
CURRENT_DIR="$(basename "$(pwd)")"

# 기존 파일 삭제 & 디렉토리 생성
rm -f "$INFO_FILE" "$STRUCTURE_FILE" "$CODE_FILE"
mkdir -p "$(dirname "$INFO_FILE")"

# 프로젝트 소개 (INFO_FILE에 저장)
echo "# StepJourney 프로젝트 소개:" >> "$INFO_FILE"
echo "- Notion의 block-based Editor 에 영감을 받아서 개발 중인 block-based step Editor" >> "$INFO_FILE"
echo "- StepJourney의 Notion 과의 핵심 차이점은 StepJourney 는 단계적인 관찰에 특화되어 핵심 데이터인 journey block 이 여러 개의 step block 으로 구성되며, 쉽게 step 간 이동을 할 수 있다는 것임" >> "$INFO_FILE"
echo "- StepJourney의 Notion 과의 차이점은 journey, step_group, step 이라는 block type으로 구성된다는 점" >> "$INFO_FILE"
echo "- Notion 의 page block 이 StepJourney 의 step block 에 부합함" >> "$INFO_FILE"
echo "- StepJourney 의 하나의 컨텐츠는 journey block 이며, journey 는 여러 개의 step block 혹은 step_group block 으로 구성됨" >> "$INFO_FILE"
echo "- 유저가 JourneyPage에서 특정 journey 를 조회할 때, 키보드 방향키를 통해 해당 journey의 이전, 이후 step 으로 이동할 수 있음." >> "$INFO_FILE"
echo "" >> "$INFO_FILE"

# 구현시 주의사항
echo "# StepJourney React Client 구현시 주의사항:" >> "$INFO_FILE"
echo "- 프로젝트 이름은 StepJourney 임" >> "$INFO_FILE"
echo "- 너의 답변의 코드를 그대로 복사하여 붙여넣어서 prod 배포할 예정이므로 주석으로 생략하는 부분 없이 완전한 코드로 보여줘. 하지만 수정사항이 없는 파일의 코드는 보여주지마." >> "$INFO_FILE"
echo "- 구현을 위해 조금이라도 수정이 된 파일은 해당 파일의 전체 코드를 완전하게 보여줘. 하지만 수정사항이 없는 파일의 코드는 보여주지마." >> "$INFO_FILE"
echo "- 상태 관리: 서버로부터 받아오는 데이터(페칭·캐싱·동기화)는 React Query가 전담하고, 모달·로딩 등 클라이언트 전용 UI 상태는 Zustand와 컴포넌트 로컬 상태로 관리 해야함" >> "$INFO_FILE"
echo "- React 클라이언트에서 UI 디자인은 shadcd/ui (\`radix-ui\`)가 추구하는 것처럼 minimal함을 추구해야함" >> "$INFO_FILE"
echo "- React 클라이언트에서 필요한 컴포넌트를 \`npx shadcn@latest add [component]\` 커맨드로 추가해서 사용해야함" >> "$INFO_FILE"
echo "- React 클라이언트에서 아이콘은 \`\"@tabler/icons-react\"\` 혹은 'lucide-react' 에서 적절한 것을 가져다가 사용해야함" >> "$INFO_FILE"
echo "" >> "$INFO_FILE"

# 상태 관리 방법:
echo "# StepJourney React 프로젝트 상태 관리 방법:" >> "$INFO_FILE"
echo "### 데이터의 출처와 목적에 따른 결정:" >> "$INFO_FILE"
echo "- 서버 데이터: React Query" >> "$INFO_FILE"
echo "- 클라이언트 전용 상태: Zustand" >> "$INFO_FILE"
echo "### 상태의 범위에 따른 결정:" >> "$INFO_FILE"
echo "- 앱 전체: Zustand (루트 스토어)" >> "$INFO_FILE"
echo "- 기능/페이지 범위: Zustand (도메인별 스토어)" >> "$INFO_FILE"
echo "- 컴포넌트 범위: useState" >> "$INFO_FILE"
echo "" >> "$INFO_FILE"

# 프로젝트 파일 구조 설명:
echo "# StepJourney React 프로젝트 파일 구조:" >> "$INFO_FILE"
echo "- src/components/ui/ : 디자인 시스템 컴포넌트 ((shadcn/ui))" >> "$INFO_FILE"
echo "- src/components/common/ : 전역에서 사용하는 공통 컴포넌트" >> "$INFO_FILE"
echo "- src/constants/ : 전역적으로 공유되는 상수 관리" >> "$INFO_FILE"
echo "- src/features/ : 도메인(기능) 기반으로 모듈화된 코드 관리" >> "$INFO_FILE"
echo "- src/features/*/*.tsx : 각 도메인의 최상위 페이지 컴포넌트로 라우팅 진입점 역할" >> "$INFO_FILE"
echo "- src/features/**/components/ : 특정 도메인에서만 사용되는 컴포넌트" >> "$INFO_FILE"
echo "- src/features/**/hooks/ : 특정 도메인 전용 커스텀 훅" >> "$INFO_FILE"
echo "- src/features/**/services/ : 특정 도메인의 API 호출 및 관련 서비스 로직" >> "$INFO_FILE"
echo "- src/features/**/store/ : 특정 도메인의 상태 관리(Zustand)" >> "$INFO_FILE"
echo "- src/features/**/types/ : 특정 도메인의 타입 정의" >> "$INFO_FILE"
echo "- src/features/**/utils/ : 특정 도메인 전용 비즈니스 로직 관련 유틸 함수" >> "$INFO_FILE"
echo "- src/hooks/ : 전역 커스텀 훅을 포함" >> "$INFO_FILE"
echo "- src/lib/ : 외부 라이브러리를 확장하거나 자체적으로 공통으로 사용하는 라이브러리화된 유틸 함수" >> "$INFO_FILE"
echo "- src/services/ : 전역에서 사용하는 서비스 로직(API 클라이언트, DB 연결 등)" >> "$INFO_FILE"
echo "- src/store/ : 앱 전체적으로 공유되는 전역 상태 관리" >> "$INFO_FILE"
echo "- src/types/ : 프로젝트 전역 공통 타입 정의" >> "$INFO_FILE"
echo "- src/utils/ : 프로젝트 전반에 걸쳐 사용하는 범용 유틸리티 함수 및 공통 로직" >> "$INFO_FILE"
echo "" >> "$INFO_FILE"

##############################################
# 프로젝트 기술 스택 출력
##############################################
echo "# Project Tech stack:" >> "$INFO_FILE"
echo "- React" >> "$INFO_FILE"
echo "- Vite" >> "$INFO_FILE"
echo "- TypeScript" >> "$INFO_FILE"
echo "- zustand" >> "$INFO_FILE"
echo "- tanstack/react-query" >> "$INFO_FILE"
echo "- Tailwind CSS" >> "$INFO_FILE"
echo "- shadcn/ui" >> "$INFO_FILE"
echo "- radix-ui" >> "$INFO_FILE"
echo "- tabler/icons-react" >> "$INFO_FILE"
echo "- lucide-react" >> "$INFO_FILE"
echo "" >> "$INFO_FILE"

##############################################
# 프로젝트 구조(tree) 출력
##############################################
echo "# Project Structure:" >> "$STRUCTURE_FILE"
tree . --charset=ASCII -I "node_modules|dist|.idea|package-lock.json|fonts" >> "$STRUCTURE_FILE"
echo "" >> "$STRUCTURE_FILE"

##############################################
# 4) 소스코드만 별도 파일에 병합
##############################################
echo "# Full Project Source Code:" >> "$CODE_FILE"
echo "" >> "$CODE_FILE"

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
  ! -path "*/public/init_data.json" \
  | sort \
  | while read -r file
do
  # file 에서 "./" 제거 후 "client-web/" 형태로 상대 경로 표현
  relative_path="$CURRENT_DIR/${file#./}"

  echo "# $relative_path:" >> "$CODE_FILE"
  cat "$file" >> "$CODE_FILE"
  echo "" >> "$CODE_FILE"
done

##############################################
# 5) 마무리 안내
##############################################
echo "프로젝트 정보가 $CURRENT_DIR/$INFO_FILE 에 성공적으로 저장되었습니다."
echo "프로젝트 구조가 $CURRENT_DIR/$STRUCTURE_FILE 에 성공적으로 저장되었습니다."
echo "소스 코드가 $CURRENT_DIR/$CODE_FILE 에 성공적으로 저장되었습니다."
