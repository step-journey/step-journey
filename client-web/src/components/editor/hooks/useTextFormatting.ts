import React, { useState, useRef, useCallback } from "react";
import { BlockType, TextFormat } from "@/types/block";

type TextSelection = {
  start: number;
  end: number;
  text: string;
};

// 캐럿 위치 정보를 저장하기 위한 타입
type CaretPosition = {
  node: Node | null;
  offset: number;
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
  onChangeType,
}: UseTextFormattingOptions) {
  const [activeFormats, setActiveFormats] = useState<TextFormat[]>([]);
  const [selectedRange, setSelectedRange] = useState<TextSelection | null>(
    null,
  );
  const lastKeyPressTime = useRef<number>(0);

  // 커서를 텍스트 끝으로 이동
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
      const formatArray = value[0][1] || [];

      // Notion 형식의 포맷 배열 분석
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

  // 현재 캐럿 위치 가져오기
  const getCaretPosition = useCallback((): CaretPosition | null => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;

    const range = selection.getRangeAt(0);
    return {
      node: range.startContainer,
      offset: range.startOffset,
    };
  }, []);

  // 캐럿 위치 저장하기
  const saveCaretPosition = useCallback((): CaretPosition | null => {
    return getCaretPosition();
  }, [getCaretPosition]);

  // 저장된 캐럿 위치 복원하기
  const restoreCaretPosition = useCallback(
    (position: CaretPosition | null) => {
      if (!position || !position.node || !editorRef.current) return;

      try {
        const selection = window.getSelection();
        if (!selection) return;

        const range = document.createRange();

        // 텍스트 노드가 아니면 대안 찾기
        if (position.node.nodeType !== Node.TEXT_NODE) {
          // 에디터 내부에 있는지 확인
          if (!editorRef.current.contains(position.node)) {
            // 에디터 내의 첫 번째 텍스트 노드 찾기
            const textNode = Array.from(editorRef.current.childNodes).find(
              (node) => node.nodeType === Node.TEXT_NODE,
            );

            if (textNode) {
              range.setStart(
                textNode,
                Math.min(position.offset, textNode.textContent?.length || 0),
              );
              range.setEnd(
                textNode,
                Math.min(position.offset, textNode.textContent?.length || 0),
              );
            } else {
              // 텍스트 노드가 없는 경우 에디터 자체를 사용
              range.setStart(editorRef.current, 0);
              range.setEnd(editorRef.current, 0);
            }
          } else {
            // 에디터 내부의 노드인 경우
            range.setStart(
              position.node,
              Math.min(position.offset, position.node.childNodes.length),
            );
            range.setEnd(
              position.node,
              Math.min(position.offset, position.node.childNodes.length),
            );
          }
        } else {
          // 텍스트 노드인 경우 직접 위치 설정
          const maxOffset = position.node.textContent?.length || 0;
          range.setStart(position.node, Math.min(position.offset, maxOffset));
          range.setEnd(position.node, Math.min(position.offset, maxOffset));
        }

        selection.removeAllRanges();
        selection.addRange(range);
      } catch (e) {
        console.error("Error restoring caret position:", e);
        // 실패하면 텍스트 끝으로 이동
        moveCursorToEnd();
      }
    },
    [editorRef, moveCursorToEnd],
  );

  // 특정 위치에 캐럿 설정하기
  const setCaretPosition = useCallback(
    (offset: number) => {
      if (!editorRef.current) return;

      const selection = window.getSelection();
      if (!selection) return;

      const range = document.createRange();
      let textNode: Node | null = null;

      // 텍스트 노드 찾기
      if (
        editorRef.current.firstChild &&
        editorRef.current.firstChild.nodeType === Node.TEXT_NODE
      ) {
        textNode = editorRef.current.firstChild;
      } else {
        // 텍스트 노드가 없는 경우 생성
        textNode = document.createTextNode("");
        editorRef.current.appendChild(textNode);
      }

      const maxOffset = textNode.textContent?.length || 0;
      const safeOffset = Math.min(offset, maxOffset);

      range.setStart(textNode, safeOffset);
      range.setEnd(textNode, safeOffset);

      selection.removeAllRanges();
      selection.addRange(range);
    },
    [editorRef],
  );

  // 포맷 적용하기
  const applyFormat = useCallback(
    (formatType: TextFormat) => {
      if (!selectedRange || !editorRef.current) return;

      const text = editorRef.current.textContent || "";

      // 현재 캐럿 위치 저장
      const savedPosition = saveCaretPosition();

      // 여기서는 간소화된 구현
      // 실제로는 Notion 포맷 배열을 수정해야 함
      const newValue: Array<[string, Array<TextFormat>]> = [
        [text, [formatType]], // 전체 텍스트에 포맷 적용
      ];

      onChange(newValue);

      // 포맷 적용 후 캐럿 위치 복원
      setTimeout(() => {
        restoreCaretPosition(savedPosition);
      }, 0);
    },
    [
      editorRef,
      onChange,
      selectedRange,
      saveCaretPosition,
      restoreCaretPosition,
    ],
  );

  // 마크다운 자동 변환 처리
  const processMarkdown = useCallback(
    (text: string): boolean => {
      // 캐럿 위치 저장
      const caretPosition = saveCaretPosition();

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
                  // 변환 후 캐럿 위치 복원 또는 이동
                  setTimeout(() => {
                    if (caretPosition) {
                      // 변환 전의 위치 복원 시도
                      setCaretPosition(
                        Math.min(caretPosition.offset, match[1].length),
                      );
                    } else {
                      moveCursorToEnd();
                    }
                  }, 0);
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
    [
      editorRef,
      moveCursorToEnd,
      onChange,
      onChangeType,
      saveCaretPosition,
      setCaretPosition,
    ],
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

    // 현재 캐럿 위치 저장
    const savedPosition = saveCaretPosition();

    // 간소화된 링크 입력, 실제로는 모달 컴포넌트 사용 권장
    const url = window.prompt("링크 URL을 입력하세요:", "https://");

    if (url && url.trim() !== "") {
      applyFormat(["a", url]);

      // 링크 삽입 후 커서 위치 조정 (링크 다음으로)
      setTimeout(() => {
        if (savedPosition && savedPosition.node) {
          const newPos = {
            node: savedPosition.node,
            offset: savedPosition.offset + selectedRange.text.length,
          };
          restoreCaretPosition(newPos);
        }
      }, 0);
    } else {
      // 취소한 경우 원래 위치로 복원
      setTimeout(() => {
        restoreCaretPosition(savedPosition);
      }, 0);
    }
  }, [applyFormat, selectedRange, saveCaretPosition, restoreCaretPosition]);

  // 현재 커서 위치의 단어 선택
  const selectWord = useCallback(() => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const node = range.startContainer;

    // 텍스트 노드가 아니면 처리하지 않음
    if (node.nodeType !== Node.TEXT_NODE) return;

    const text = node.textContent || "";
    const cursorPos = range.startOffset;

    // 현재 커서가 있는 단어의 시작과 끝 찾기
    let start = cursorPos;
    let end = cursorPos;

    // 단어 시작 찾기 (왼쪽으로)
    while (start > 0 && !/\s/.test(text.charAt(start - 1))) {
      start--;
    }

    // 단어 끝 찾기 (오른쪽으로)
    while (end < text.length && !/\s/.test(text.charAt(end))) {
      end++;
    }

    // 새 범위 설정
    const newRange = document.createRange();
    newRange.setStart(node, start);
    newRange.setEnd(node, end);

    selection.removeAllRanges();
    selection.addRange(newRange);

    // 선택 정보 업데이트
    setSelectedRange({
      start,
      end,
      text: text.substring(start, end),
    });
  }, [editorRef]);

  // 블록 전체 선택
  const selectEntireBlock = useCallback(() => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    if (!selection) return;

    const range = document.createRange();
    range.selectNodeContents(editorRef.current);

    selection.removeAllRanges();
    selection.addRange(range);

    // 선택 정보 업데이트
    const text = editorRef.current.textContent || "";
    setSelectedRange({
      start: 0,
      end: text.length,
      text,
    });
  }, [editorRef]);

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
    selectWord,
    selectEntireBlock,
    getCaretPosition,
    setCaretPosition,
    saveCaretPosition,
    restoreCaretPosition,
  };
}
