#!/usr/bin/env bash
# 에러 발생 시 스크립트 중단 설정 (단, tsc 명령은 예외 처리 예정)
set -e

# client-web 디렉토리로 이동
cd "$(dirname "$0")/.."

# 출력 파일 정의
OUTPUT_FILE="script/combined_compile_errors.txt"
TEMP_FILE="script/temp_compile_errors.txt"

# 기존 출력 파일 삭제 및 디렉토리 생성
rm -f "$OUTPUT_FILE"
mkdir -p "$(dirname "$OUTPUT_FILE")"

# 구현시 주의사항
echo "# StepJourney React Client 문제 해결시 주의사항:" >> "$OUTPUT_FILE"
echo "- 너의 답변의 코드를 그대로 복사하여 붙여넣어서 prod 배포할 예정이므로 주석으로 생략하는 부분 없이 완전한 코드로 보여줘. 하지만 수정사항이 없는 파일의 코드는 보여주지마." >> "$OUTPUT_FILE"
echo "- 구현 혹은 문제 해결을 위해 조금이라도 수정이 된 파일은 해당 파일의 전체 코드를 완전하게 보여줘. 하지만 수정사항이 없는 파일의 코드는 보여주지마." >> "$OUTPUT_FILE"
echo "- React 클라이언트에서 UI 디자인은 shadcd/ui (\`radix-ui\`)가 추구하는 것처럼 minimal함을 추구해야함" >> "$OUTPUT_FILE"
echo "- React 클라이언트에서 필요한 컴포넌트를 \`npx shadcn@latest add [component]\` 커맨드로 추가해서 사용해야함" >> "$OUTPUT_FILE"
echo "- React 클라이언트에서 아이콘은 \`\"@tabler/icons-react\"\` 에서 적절한 것을 가져다가 사용해야함" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

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

      # 파일이 존재하는지 확인
      if [ -f "$file" ]; then
        # Code Context 부분은 제거

        # 오류 위치 표시 방법 개선
        echo "" >> "$OUTPUT_FILE"
        echo "### Error Location:" >> "$OUTPUT_FILE"

        # 파일에서 해당 라인 읽기
        error_line=$(sed -n "${line_num}p" "$file" || echo "Line not found")

        # 오류 라인에서 문제 부분 표시 (cut 명령 오류 방지)
        if [ -n "$error_line" ]; then
          # 오류 위치를 표시할 코드 부분 추출 (최대 20자까지)
          problematic_code=$(echo "$error_line" | cut -c${col_num}- | head -c 20)
          if [ -z "$problematic_code" ]; then
            problematic_code="(위치를 찾을 수 없음)"
          fi

          echo "Line $line_num: \`$error_line\`" >> "$OUTPUT_FILE"
          echo "Problem: \`$problematic_code\` at column $col_num" >> "$OUTPUT_FILE"
        else
          echo "Line $line_num: (라인을 읽을 수 없음)" >> "$OUTPUT_FILE"
        fi

        echo "" >> "$OUTPUT_FILE"
      else
        echo "  [File not found: $file]" >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
      fi

      error_count=$((error_count + 1))
    else
      # TS6305와 같은 메타 오류는 필터링
      if ! [[ $line =~ TS6305 || $line =~ TS6306 || $line =~ TS6310 ]]; then
        echo "$line" >> "$OUTPUT_FILE"
      fi
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
      echo '```typescript' >> "$OUTPUT_FILE"
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