import React, { useCallback } from "react";
import { BlockType } from "@/types/block";
import { useCaretManager } from "@/lib/caret";

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
  setCommandMenuOpen: (open: boolean) => void;
  setFormatMenuOpen: (open: boolean) => void;
  caretManager?: ReturnType<typeof useCaretManager>;
  selectWord: () => void;
  selectEntireBlock: () => void;
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
  setCommandMenuOpen,
  setFormatMenuOpen,
  caretManager,
  selectWord,
  selectEntireBlock,
}: UseTextEditorKeydownOptions) {
  // 기본 캐럿 관리자 구성
  const defaultCaretManager = useCaretManager({
    editorRef,
    debug: false,
  });

  // 제공된 캐럿 관리자 또는 기본 관리자 사용
  const caret = caretManager || defaultCaretManager;

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

      const text = editorRef.current?.textContent || "";
      const selection = window.getSelection();
      const isTextSelected = selection && !selection.isCollapsed;

      // Enter 키 처리
      if (e.key === "Enter") {
        if (e.shiftKey) {
          // Shift+Enter: 줄바꿈
          e.preventDefault();
          insertLineBreak();
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

      // Home/End 키 처리
      if (e.key === "Home") {
        e.preventDefault();
        if (e.ctrlKey || e.metaKey) {
          // Ctrl+Home: 문서 처음으로
          caret.moveToStart();
        } else if (e.shiftKey) {
          // 현재 셀렉션 유지하면서 줄 시작점까지 확장
          // selectToLineStart() 구현 필요할 수 있음
        } else {
          // Home: 줄의 시작으로
          const position = caret.getCaretPosition();
          if (position) {
            // 현재 줄의 시작 위치 파악 필요 (간략화된 구현)
            const textBeforeCursor = text.substring(0, position.offset);
            const lastNewlinePos = textBeforeCursor.lastIndexOf("\n");
            const lineStartPos = lastNewlinePos === -1 ? 0 : lastNewlinePos + 1;

            caret.setCaretPosition({
              node: position.node,
              offset: lineStartPos,
            });
          }
        }
        return;
      }

      if (e.key === "End") {
        e.preventDefault();
        if (e.ctrlKey || e.metaKey) {
          // Ctrl+End: 문서 끝으로
          caret.moveToEnd();
        } else if (e.shiftKey) {
          // 현재 셀렉션 유지하면서 줄 끝까지 확장
          // selectToLineEnd() 구현 필요할 수 있음
        } else {
          // End: 줄의 끝으로
          const position = caret.getCaretPosition();
          if (position) {
            // 현재 줄의 끝 위치 파악 필요 (간략화된 구현)
            const textAfterCursor = text.substring(position.offset);
            const nextNewlinePos = textAfterCursor.indexOf("\n");
            const lineEndPos =
              position.offset +
              (nextNewlinePos === -1 ? textAfterCursor.length : nextNewlinePos);

            caret.setCaretPosition({
              node: position.node,
              offset: lineEndPos,
            });
          }
        }
        return;
      }

      // 방향키 처리
      if (e.key === "ArrowUp") {
        if (caret.isAtLineStart()) {
          if (onArrowUp) {
            e.preventDefault();
            // 이전 블록으로 이동 시 캐럿 위치 저장
            caret.saveColumnForBlockNavigation();
            onArrowUp();
          }
        }
        return;
      }

      if (e.key === "ArrowDown") {
        if (caret.isAtLineEnd()) {
          if (onArrowDown) {
            e.preventDefault();
            // 다음 블록으로 이동 시 캐럿 위치 저장
            caret.saveColumnForBlockNavigation();
            onArrowDown();
          }
        }
        return;
      }

      // Backspace 처리 (빈 블록 삭제)
      if (e.key === "Backspace") {
        const isAtStart = caret.isAtLineStart();

        if (editorRef.current?.textContent === "" && onDelete) {
          // 빈 블록 삭제
          e.preventDefault();
          onDelete();
        } else if (isAtStart && onArrowUp) {
          // 블록 시작에서 Backspace는 이전 블록과 병합
          e.preventDefault();
          onArrowUp(); // 이전 블록으로 이동 후
          // 이전 블록의 내용과 현재 블록의 내용 병합은 별도 로직 필요
        }
        return;
      }

      // Delete 키로 블록 선택 시 삭제
      if (e.key === "Delete" && isTextSelected && onDelete) {
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
          case "d": // 단어 선택 추가
            e.preventDefault();
            selectWord(); // selectWord 사용
            return;
          case "a": // 전체 선택
            e.preventDefault();
            selectEntireBlock();
            return;
        }
      }
    },
    [
      applyShortcutFormat,
      blockType,
      caret,
      selectWord,
      editorRef,
      insertLineBreak,
      onChange,
      onArrowDown,
      onArrowUp,
      onDelete,
      onEnter,
      onShiftTab,
      onTab,
      selectEntireBlock,
      setCommandMenuOpen,
      setFormatMenuOpen,
      value,
    ],
  );

  return { handleKeyDown };
}
