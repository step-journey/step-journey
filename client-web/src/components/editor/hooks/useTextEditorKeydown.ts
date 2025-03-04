import React, { useCallback } from "react";
import { BlockType } from "@/types/block";

interface UseTextEditorKeydownOptions {
  editorRef: React.RefObject<HTMLDivElement>;
  blockType: BlockType;
  value: Array<[string, any[]]>;
  onChange: (value: Array<[string, any[]]>) => void;
  onEnter?: (e?: any) => void;
  onTab?: () => void;
  onShiftTab?: () => void;
  onDelete?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  insertLineBreak: () => void;
  applyShortcutFormat: (key: string) => void;
  setFormatMenuOpen: (open: boolean) => void;
  setCommandMenuOpen: (open: boolean) => void;
}

/**
 * 텍스트 에디터의 키보드 이벤트 처리를 위한 훅
 */
export function useTextEditorKeydown({
  editorRef,
  blockType,
  value,
  onChange,
  onEnter,
  onTab,
  onShiftTab,
  onDelete,
  onArrowUp,
  onArrowDown,
  insertLineBreak,
  applyShortcutFormat,
  setFormatMenuOpen,
  setCommandMenuOpen,
}: UseTextEditorKeydownOptions) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      // 커맨드 메뉴 열려있을 때는 메뉴에서 처리
      if (
        e.key === "ArrowUp" ||
        e.key === "ArrowDown" ||
        e.key === "Enter" ||
        e.key === "Escape"
      ) {
        if (value[0][0]?.startsWith("/")) {
          e.preventDefault();
          return;
        }
      }

      // Escape 키로 포맷 메뉴 닫기
      if (e.key === "Escape") {
        setFormatMenuOpen(false);
        setCommandMenuOpen(false);
        return;
      }

      // Enter 키 처리
      if (e.key === "Enter") {
        if (e.shiftKey) {
          // Shift+Enter: 줄바꿈
          e.preventDefault();
          insertLineBreak();
        } else if (blockType === "code") {
          // 코드 블록: 줄바꿈 (단, onEnter 콜백 호출)
          e.preventDefault();
          if (editorRef.current) {
            const text = editorRef.current.textContent || "";
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              const cursorPos = range.startOffset;

              // 커서 위치에 줄바꿈 삽입
              const newText =
                text.substring(0, cursorPos) + "\n" + text.substring(cursorPos);
              editorRef.current.textContent = newText;

              // 커서 위치 조정
              const newRange = document.createRange();
              const textNode =
                editorRef.current.firstChild || editorRef.current;
              newRange.setStart(textNode, cursorPos + 1);
              newRange.setEnd(textNode, cursorPos + 1);
              selection.removeAllRanges();
              selection.addRange(newRange);

              // 변경 사항 알림
              onChange([[newText, []]]);
            }
          }
        } else if (onEnter) {
          // 일반 블록: 새 블록 생성
          e.preventDefault();
          onEnter(e);
        }
        return;
      }

      // Tab/Shift+Tab 처리
      if (e.key === "Tab") {
        e.preventDefault();
        if (e.shiftKey && onShiftTab) {
          onShiftTab();
        } else if (onTab) {
          onTab();
        }
        return;
      }

      // 방향키 처리
      if (e.key === "ArrowUp") {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const isAtStart =
            range.startOffset === 0 &&
            (range.startContainer === editorRef.current ||
              (range.startContainer.nodeType === Node.TEXT_NODE &&
                !range.startContainer.previousSibling));

          if (isAtStart && onArrowUp) {
            e.preventDefault();
            onArrowUp();
          }
        }
      } else if (e.key === "ArrowDown") {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const text = editorRef.current?.textContent || "";
          const isAtEnd =
            range.startOffset === text.length &&
            (range.startContainer === editorRef.current ||
              (range.startContainer.nodeType === Node.TEXT_NODE &&
                !range.startContainer.nextSibling));

          if (isAtEnd && onArrowDown) {
            e.preventDefault();
            onArrowDown();
          }
        }
      }

      // Backspace 처리 (빈 블록 삭제)
      if (
        e.key === "Backspace" &&
        editorRef.current?.textContent === "" &&
        onDelete
      ) {
        e.preventDefault();
        onDelete();
        return;
      }

      // 단축키 처리
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "b": // 굵게
          case "i": // 기울임
          case "u": // 밑줄
          case "e": // 인라인 코드
          case "k": // 링크
            e.preventDefault();
            applyShortcutFormat(e.key.toLowerCase());
            return;
        }
      }
    },
    [
      applyShortcutFormat,
      blockType,
      editorRef,
      insertLineBreak,
      onChange,
      onArrowDown,
      onArrowUp,
      onDelete,
      onEnter,
      onShiftTab,
      onTab,
      setFormatMenuOpen,
      setCommandMenuOpen,
      value,
    ],
  );

  return { handleKeyDown };
}
