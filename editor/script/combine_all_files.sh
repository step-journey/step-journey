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
echo "# WYSIWYG block based editor 구현시 주의사항:" >> "$OUTPUT_FILE"
echo "- 너의 답변의 코드를 그대로 복사하여 붙여넣어서 prod 배포할 예정이므로 주석으로 생략하는 부분 없이 완전한 코드로 보여줘. 하지만 수정사항이 없는 파일의 코드는 보여주지마." >> "$OUTPUT_FILE"
echo "- 구현을 위해 조금이라도 수정이 된 파일은 해당 파일의 전체 코드를 완전하게 보여줘. 하지만 수정사항이 없는 파일의 코드는 보여주지마." >> "$OUTPUT_FILE"
echo "- ProseMirror, Tiptap 라이브러리를 사용하여 Notion 의 block based editor 와 동일하게 작동하는 에디터를 구현해야함" >> "$OUTPUT_FILE"
echo "- Tiptap 라이브러리를 우선적으로 사용하며 정밀한 제어가 필요한 기능은 ProseMirror 라이브러리를 사용해야함" >> "$OUTPUT_FILE"
echo "- 이 프로젝트에서 구현한 editor를 React 웹 클라이언트 프로젝트에서 import 하여 사용할 예정임" >> "$OUTPUT_FILE"
echo "- React 클라이언트에서 UI 디자인은 shadcd/ui (\`radix-ui\`)가 추구하는 것처럼 minimal함을 추구해야함" >> "$OUTPUT_FILE"
echo "- React 클라이언트에서 필요한 컴포넌트를 \`npx shadcn@latest add [component]\` 커맨드로 추가해서 사용해야함" >> "$OUTPUT_FILE"
echo "- React 클라이언트에서 아이콘은 \`\"@tabler/icons-react\"\` 혹은 @radix-ui/react-avatar 에서 적절한 것을 가져다가 사용해야함" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

##############################################
# 2) 프로젝트 구조(tree) 출력
##############################################
echo "# Project Structure:" >> "$OUTPUT_FILE"
tree . --charset=ASCII -I "node_modules|dist|.idea|package-lock.json|fonts" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

##############################################
# 3) 프로젝트 기술 스택 출력
##############################################
#echo "# Project Tech stack:" >> "$OUTPUT_FILE"
#echo "- React" >> "$OUTPUT_FILE"
#echo "- Vite" >> "$OUTPUT_FILE"
#echo "- TypeScript" >> "$OUTPUT_FILE"
#echo "- Tailwind CSS" >> "$OUTPUT_FILE"
#echo "- shadcn/ui" >> "$OUTPUT_FILE"
#echo "- radix-ui" >> "$OUTPUT_FILE"
#echo "- tabler/icons-react" >> "$OUTPUT_FILE"
#echo "" >> "$OUTPUT_FILE"

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
  ! -path "*/src/data/*" \
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
