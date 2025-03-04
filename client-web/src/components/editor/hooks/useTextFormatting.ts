import React, { useState, useRef, useCallback } from "react";
import { BlockType, TextFormat } from "@/types/block";

type TextSelection = {
  start: number;
  end: number;
  text: string;
};

interface UseTextFormattingOptions {
  editorRef: React.RefObject<HTMLDivElement>;
  value: Array<[string, Array<TextFormat>]>;
  onChange: (value: Array<[string, Array<TextFormat>]>) => void;
  blockType: BlockType;
  onChangeType?: (type: BlockType) => void;
}

/**
 * 텍스트 서식 및 마크다운 변환 등을 처리하는 훅
 */
export function useTextFormatting({
  editorRef,
  value,
  onChange,
  blockType,
  onChangeType,
}: UseTextFormattingOptions) {
  const [activeFormats, setActiveFormats] = useState<TextFormat[]>([]);
  const [selectedRange, setSelectedRange] = useState<TextSelection | null>(
    null,
  );
  const lastKeyPressTime = useRef<number>(0);

  // 현재 선택된 텍스트 감지
  const detectSelection = useCallback(() => {
    const selection = window.getSelection();
    if (
      !selection ||
      selection.rangeCount === 0 ||
      selection.isCollapsed ||
      !editorRef.current
    ) {
      setSelectedRange(null);
      return null;
    }

    const range = selection.getRangeAt(0);
    const selectedText = range.toString().trim();

    if (selectedText) {
      const newSelection = {
        start: range.startOffset,
        end: range.endOffset,
        text: selectedText,
      };
      setSelectedRange(newSelection);

      // 현재 적용된 포맷 감지
      // 간소화된 버전으로, 실제로는 Notion의 포맷 배열을 분석해야 함
      detectAppliedFormats(newSelection);

      return newSelection;
    }

    setSelectedRange(null);
    return null;
  }, [editorRef]);

  // 적용된 포맷 감지하기
  const detectAppliedFormats = useCallback(
    (selection: TextSelection) => {
      // 여기서는 단순화된 구현
      // 실제로는 Notion의 포맷 배열을 분석해야 함
      const formats: TextFormat[] = [];

      // 원래 텍스트에서 선택 영역 분석
      const originalText = value[0][0];
      const formatArray = value[0][1] || [];

      // Notion 형식의 포맷 배열 분석
      // 아래는 간소화된 예시일 뿐, 실제 구현에서는 더 복잡한 로직이 필요함
      formatArray.forEach((format) => {
        if (
          format[0] === "b" ||
          format[0] === "i" ||
          format[0] === "u" ||
          format[0] === "s"
        ) {
          formats.push(format as TextFormat);
        }
      });

      setActiveFormats(formats);
    },
    [value],
  );

  // 포맷 적용하기
  const applyFormat = useCallback(
    (formatType: TextFormat) => {
      if (!selectedRange || !editorRef.current) return;

      const text = editorRef.current.textContent || "";

      // 여기서는 간소화된 구현
      // 실제로는 Notion 포맷 배열을 수정해야 함

      // 전체 텍스트를 그대로 두고 포맷 정보만 업데이트해야 함
      // 이 예제에서는 단순화를 위해 텍스트만 반환
      const newValue: Array<[string, Array<TextFormat>]> = [
        [text, [formatType]], // 전체 텍스트에 포맷 적용
      ];

      onChange(newValue);
    },
    [editorRef, onChange, selectedRange],
  );
  // Define moveCursorToEnd BEFORE processMarkdown
  // Move this function above the processMarkdown function
  const moveCursorToEnd = useCallback(() => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    if (!selection) return;

    const range = document.createRange();

    // Content exists
    if (editorRef.current.firstChild && editorRef.current.textContent) {
      const lastNode = editorRef.current.lastChild;
      if (lastNode && lastNode.nodeType === Node.TEXT_NODE) {
        const textNode = lastNode as Text;
        const length = textNode.textContent?.length || 0;
        range.setStart(textNode, length);
        range.setEnd(textNode, length);
      } else {
        const textNode = document.createTextNode("");
        editorRef.current.appendChild(textNode);
        range.setStart(textNode, 0);
        range.setEnd(textNode, 0);
      }
    } else {
      const textNode = document.createTextNode("");
      editorRef.current.appendChild(textNode);
      range.setStart(textNode, 0);
      range.setEnd(textNode, 0);
    }

    selection.removeAllRanges();
    selection.addRange(range);
  }, [editorRef]);

  // 마크다운 자동 변환 처리
  const processMarkdown = useCallback(
    (text: string): boolean => {
      // 마크다운 변환을 위한 규칙
      const markdownRules = [
        // 제목
        { pattern: /^# (.+)$/, action: () => onChangeType?.("heading_1") },
        { pattern: /^## (.+)$/, action: () => onChangeType?.("heading_2") },
        { pattern: /^### (.+)$/, action: () => onChangeType?.("heading_3") },

        // 목록
        { pattern: /^- (.+)$/, action: () => onChangeType?.("bulleted_list") },
        { pattern: /^\* (.+)$/, action: () => onChangeType?.("bulleted_list") },
        {
          pattern: /^1\. (.+)$/,
          action: () => onChangeType?.("numbered_list"),
        },

        // 체크박스
        { pattern: /^\[ \] (.+)$/, action: () => onChangeType?.("to_do") },
        { pattern: /^\[x\] (.+)$/, action: () => onChangeType?.("to_do") },

        // 블록 요소
        { pattern: /^> (.+)$/, action: () => onChangeType?.("quote") },
        { pattern: /^```(.*)$/, action: () => onChangeType?.("code") },

        // 구분선
        { pattern: /^---$/, action: () => onChangeType?.("divider") },
        { pattern: /^___$/, action: () => onChangeType?.("divider") },
        { pattern: /^\*\*\*$/, action: () => onChangeType?.("divider") },
      ];

      // 스페이스가 마크다운 변환 트리거
      if (text.endsWith(" ")) {
        const textWithoutSpace = text.slice(0, -1);

        for (const rule of markdownRules) {
          if (rule.pattern.test(textWithoutSpace)) {
            // 일치하는 패턴 실행
            rule.action();

            // 특수 문자 제거하고 내용만 반환
            const match = textWithoutSpace.match(rule.pattern);
            if (match && match[1]) {
              // 변환 후 텍스트 설정
              setTimeout(() => {
                if (editorRef.current) {
                  editorRef.current.textContent = match[1];
                  onChange([[match[1], []]]);
                  moveCursorToEnd();
                }
              }, 0);
            } else if (
              rule.pattern.toString().includes("---") ||
              rule.pattern.toString().includes("___") ||
              rule.pattern.toString().includes("\\*\\*\\*")
            ) {
              // 구분선의 경우 내용 비우기
              setTimeout(() => {
                if (editorRef.current) {
                  editorRef.current.textContent = "";
                  onChange([["", []]]);
                }
              }, 0);
            }
            return true;
          }
        }
      }
      return false;
    },
    [editorRef, moveCursorToEnd, onChange, onChangeType],
  );

  // 줄바꿈 삽입
  const insertLineBreak = useCallback(() => {
    if (!editorRef.current) return;

    const text = editorRef.current.textContent || "";
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const cursorPos = range.startOffset;

    // 커서 위치에 줄바꿈 삽입
    const newText =
      text.substring(0, cursorPos) + "\n" + text.substring(cursorPos);
    editorRef.current.textContent = newText;

    // 커서 위치 조정
    const newRange = document.createRange();
    const textNode = editorRef.current.firstChild || editorRef.current;
    newRange.setStart(textNode, cursorPos + 1);
    newRange.setEnd(textNode, cursorPos + 1);
    selection.removeAllRanges();
    selection.addRange(newRange);

    // 부모 컴포넌트에 변경 알림
    onChange([[newText, []]]);
  }, [editorRef, onChange]);

  // 링크 삽입
  const promptForLink = useCallback(() => {
    if (!selectedRange) return;

    // 간소화된 링크 입력, 실제로는 모달 컴포넌트 사용 권장
    const url = window.prompt("링크 URL을 입력하세요:", "https://");

    if (url && url.trim() !== "") {
      applyFormat(["a", url]);
    }
  }, [applyFormat, selectedRange]);

  return {
    selectedRange,
    activeFormats,
    lastKeyPressTime,
    detectSelection,
    applyFormat,
    processMarkdown,
    moveCursorToEnd,
    insertLineBreak,
    promptForLink,
  };
}
