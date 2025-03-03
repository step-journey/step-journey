#!/usr/bin/env bash

# 에러 발생 시 스크립트 중단 설정 (단, tsc 명령은 예외 처리 예정)
set -e

# client-web 디렉토리로 이동
cd "$(dirname "$0")/.."

# 출력 파일 정의
OUTPUT_FILE="script/compile_errors.txt"
TEMP_FILE="script/temp_compile_errors.txt"

# 기존 출력 파일 삭제 및 디렉토리 생성
rm -f "$OUTPUT_FILE"
mkdir -p "$(dirname "$OUTPUT_FILE")"

# 프로젝트 구조 추가
echo "# Project Structure:" >> "$OUTPUT_FILE"
tree . --charset=ASCII -I "node_modules|dist|.idea|package-lock.json|fonts" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# 프로젝트 기술 스택 추가
echo "# Project Tech stack:" >> "$OUTPUT_FILE"
echo "- React" >> "$OUTPUT_FILE"
echo "- Vite" >> "$OUTPUT_FILE"
echo "- TypeScript" >> "$OUTPUT_FILE"
echo "- Tailwind CSS" >> "$OUTPUT_FILE"
echo "- shadcn/ui" >> "$OUTPUT_FILE"
echo "- radix-ui" >> "$OUTPUT_FILE"
echo "- tabler/icons-react" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# `client-web/src/types` 경로의 모든 .ts 파일 추가
echo "# Type Definitions (client-web/src/types):" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# src/types 디렉토리의 모든 .ts 파일을 찾음
type_files=$(find src/types -name "*.ts" 2>/dev/null)

if [ -n "$type_files" ]; then
  for file in $type_files; do
    if [ -f "$file" ]; then
      echo "## $file" >> "$OUTPUT_FILE"
      echo '```ts' >> "$OUTPUT_FILE"
      cat "$file" >> "$OUTPUT_FILE"
      echo '```' >> "$OUTPUT_FILE"
      echo "" >> "$OUTPUT_FILE"
    fi
  done
else
  echo "No type definition files found in src/types." >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE"
fi

# 컴파일 오류 섹션 헤더 추가
echo "# Compilation Errors:" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# 오류가 발생한 파일 목록을 저장할 배열 (중복 방지)
error_files=()

# TypeScript 컴파일 오류 수집 (임시 파일에 저장)
npx tsc --noEmit -p tsconfig.app.json > "$TEMP_FILE" 2>&1 || true

# 오류 메시지를 개선된 형식으로 변환
if [ -s "$TEMP_FILE" ]; then
  error_count=1
  while IFS= read -r line; do
    if [[ $line =~ ^([^:]+)\(([0-9]+),([0-9]+)\):\ error\ ([A-Z0-9]+):\ (.+)$ ]]; then
      file="${BASH_REMATCH[1]}"
      line_num="${BASH_REMATCH[2]}"
      col_num="${BASH_REMATCH[3]}"
      error_code="${BASH_REMATCH[4]}"
      error_message="${BASH_REMATCH[5]}"

      # 오류가 발생한 파일을 배열에 추가 (중복 방지)
      if ! [[ " ${error_files[@]} " =~ " $file " ]]; then
        error_files+=("$file")
      fi

      # 오류 섹션 시작
      echo "## Error $error_count:" >> "$OUTPUT_FILE"
      echo "$file($line_num,$col_num): error $error_code: $error_message" >> "$OUTPUT_FILE"

      # 파일에서 해당 라인 주변의 코드 추출 (예: 2줄 전후)
      if [ -f "$file" ]; then
        start_line=$((line_num - 2))
        end_line=$((line_num + 2))
        if [ $start_line -lt 1 ]; then
          start_line=1
        fi
        echo "" >> "$OUTPUT_FILE"
        echo "  Code Context (lines $start_line to $end_line):" >> "$OUTPUT_FILE"
        echo "    ```tsx" >> "$OUTPUT_FILE"
        sed -n "${start_line},${end_line}p" "$file" | sed 's/^[ \t]*//;s/[ \t]*$//' >> "$OUTPUT_FILE"
        echo "    ```" >> "$OUTPUT_FILE"

        # 오류가 발생한 라인과 컬럼 강조
        echo "    Error at line $line_num, column $col_num:" >> "$OUTPUT_FILE"
        error_line=$(sed "${line_num}q;d" "$file" | sed 's/^[ \t]*//;s/[ \t]*$//')
        echo "    $error_line" >> "$OUTPUT_FILE"
        underline=$(printf "%*s" "$((col_num - 1))" "" | tr ' ' ' ' && echo "^")
        echo "    $underline" >> "$OUTPUT_FILE"
      else
        echo "  [File not found: $file]" >> "$OUTPUT_FILE"
      fi

      echo "" >> "$OUTPUT_FILE"
      error_count=$((error_count + 1))
    else
      echo "$line" >> "$OUTPUT_FILE"
    fi
  done < "$TEMP_FILE"
else
  echo "No compilation errors found." >> "$OUTPUT_FILE"
fi

# 오류가 발생한 파일의 전체 코드 추가
if [ "${#error_files[@]}" -gt 0 ]; then
  echo "" >> "$OUTPUT_FILE"
  echo "# Full Source Code of Error Files:" >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE"

  for file in "${error_files[@]}"; do
    if [ -f "$file" ]; then
      echo "## $file" >> "$OUTPUT_FILE"
      echo '```tsx' >> "$OUTPUT_FILE"
      cat "$file" >> "$OUTPUT_FILE"
      echo '```' >> "$OUTPUT_FILE"
      echo "" >> "$OUTPUT_FILE"
    fi
  done
fi

# 임시 파일 삭제
rm -f "$TEMP_FILE"

# 사용자에게 완료 메시지 출력
echo "컴파일 오류가 $OUTPUT_FILE 에 수집되었습니다."