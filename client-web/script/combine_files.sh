#!/usr/bin/env bash

set -e
# todo 프로젝트 소개 추가

# 스크립트가 위치한 디렉토리 기준으로 프로젝트 루트로 이동
cd "$(dirname "$0")/.."

OUTPUT_FILE="combined.txt"
CURRENT_DIR="$(basename "$(pwd)")"

# 기존 파일이 있다면 삭제
rm -f "$OUTPUT_FILE"

# 프로젝트 구조(tree) 출력
#    - node_modules, dist, .idea 폴더와 package-lock.json 파일은 제외
echo "# Project Structure:" >> "$OUTPUT_FILE"
tree . --charset=ASCII -I "node_modules|dist|.idea|package-lock.json|fonts" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# 프로젝트 기술 스택 출력
echo "# Project Tech stack:" >> "$OUTPUT_FILE"
echo "- React" >> "$OUTPUT_FILE"
echo "- Vite" >> "$OUTPUT_FILE"
echo "- TypeScript" >> "$OUTPUT_FILE"
echo "- Tailwind CSS" >> "$OUTPUT_FILE"
echo "- shadcn/ui" >> "$OUTPUT_FILE"
echo "- radix-ui" >> "$OUTPUT_FILE"
echo "- tabler/icons-react" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# 조건에 맞는 파일들을 하나의 파일($OUTPUT_FILE)로 병합
#    - node_modules, dist, .idea 폴더 및 package-lock.json 제외
echo "# Full Project Source Code:" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

find . \
  \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" -o -name "*.yml" -o -name "*.css" -o -name "*.html" \) \
  ! -path "*/node_modules/*" \
  ! -path "*/dist/*" \
  ! -path "*/fonts/*" \
  ! -path "*/src/data/*" \
  ! -path "*/.idea/*" \
  ! -name "package-lock.json" \
  -exec sh -c '
    echo "### $PWD/$1" >> "$2"
    cat "$1" >> "$2"
    echo -e "\n\n" >> "$2"
  ' _ {} "$OUTPUT_FILE" \;

# 추가 확장자(*.json, *.sh 등)를 포함해서 다시 한번 병합
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
  ! -name "package-lock.json" \
  | sort | while read -r file
do
  # 상대 경로에서 "./"를 제거하고 앞에 "$CURRENT_DIR/"를 붙임
  relative_path="$CURRENT_DIR/${file#./}"

  echo "# $relative_path:" >> "$OUTPUT_FILE"
  cat "$file" >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE"
done

# 최종 메시지
echo "모든 파일이 $CURRENT_DIR/$OUTPUT_FILE 에 성공적으로 병합되었습니다."
