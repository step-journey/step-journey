import React, { useCallback } from "react";
import { BlockType } from "@/types/block";

type CaretPosition = {
  node: Node | null;
  offset: number;
};

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
  setCaretPosition: (offset: number) => void;
  getCaretPosition: () => CaretPosition | null;
  saveCaretPosition: () => CaretPosition | null;
  restoreCaretPosition: (position: CaretPosition | null) => void;
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
  setCaretPosition,
  getCaretPosition,
  saveCaretPosition,
  restoreCaretPosition,
  selectWord,
  selectEntireBlock,
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

      const text = editorRef.current?.textContent || "";
      const selection = window.getSelection();
      const isTextSelected = selection && !selection.isCollapsed;

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

      // Home/End 키 처리
      if (e.key === "Home") {
        e.preventDefault();
        if (e.ctrlKey || e.metaKey) {
          // Ctrl+Home: 문서 처음으로
          setCaretPosition(0);
        } else if (e.shiftKey) {
          // Shift+Home: 커서부터 줄 시작까지 선택
          selectToLineStart();
        } else {
          // Home: 줄의 시작으로
          moveToLineStart();
        }
        return;
      }

      if (e.key === "End") {
        e.preventDefault();
        if (e.ctrlKey || e.metaKey) {
          // Ctrl+End: 문서 끝으로
          setCaretPosition(text.length);
        } else if (e.shiftKey) {
          // Shift+End: 커서부터 줄 끝까지 선택
          selectToLineEnd();
        } else {
          // End: 줄의 끝으로
          moveToLineEnd();
        }
        return;
      }

      // 방향키 처리
      if (e.key === "ArrowLeft") {
        if (e.ctrlKey || e.metaKey) {
          // Ctrl+Left: 단어 단위 이동
          e.preventDefault();
          if (e.shiftKey) {
            // Shift+Ctrl+Left: 단어 단위 선택
            selectWordLeft();
          } else {
            moveWordLeft();
          }
        } else if (e.shiftKey && !isTextSelected) {
          // Shift+Left: 문자 단위 선택
          e.preventDefault();
          selectCharLeft();
        } else if (selection && selection.isCollapsed) {
          // 커서가 텍스트의 시작이면 이전 블록으로
          const position = getCaretPosition();
          if (position && position.offset === 0) {
            if (onArrowUp) {
              e.preventDefault();
              onArrowUp(); // 이전 블록으로 (위로 이동)
            }
          }
        }
        return;
      }

      if (e.key === "ArrowRight") {
        if (e.ctrlKey || e.metaKey) {
          // Ctrl+Right: 단어 단위 이동
          e.preventDefault();
          if (e.shiftKey) {
            // Shift+Ctrl+Right: 단어 단위 선택
            selectWordRight();
          } else {
            moveWordRight();
          }
        } else if (e.shiftKey && !isTextSelected) {
          // Shift+Right: 문자 단위 선택
          e.preventDefault();
          selectCharRight();
        } else if (selection && selection.isCollapsed) {
          // 커서가 텍스트의 끝이면 다음 블록으로
          const position = getCaretPosition();
          if (position && position.offset === text.length) {
            if (onArrowDown) {
              e.preventDefault();
              onArrowDown(); // 다음 블록으로 (아래로 이동)
            }
          }
        }
        return;
      }

      if (e.key === "ArrowUp") {
        if (e.ctrlKey || e.metaKey) {
          // Ctrl+Up: 문단 시작으로
          e.preventDefault();
          setCaretPosition(0);
        } else {
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
            } else if (!isTextLineStart()) {
              // 같은 블록의 이전 줄로 이동
              e.preventDefault();
              moveUpToSameColumn();
            }
          }
        }
        return;
      }

      if (e.key === "ArrowDown") {
        if (e.ctrlKey || e.metaKey) {
          // Ctrl+Down: 문단 끝으로
          e.preventDefault();
          setCaretPosition(text.length);
        } else {
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const isAtEnd =
              range.startOffset === text.length &&
              (range.startContainer === editorRef.current ||
                (range.startContainer.nodeType === Node.TEXT_NODE &&
                  !range.startContainer.nextSibling));

            if (isAtEnd && onArrowDown) {
              e.preventDefault();
              onArrowDown();
            } else if (!isTextLineEnd()) {
              // 같은 블록의 다음 줄로 이동
              e.preventDefault();
              moveDownToSameColumn();
            }
          }
        }
        return;
      }

      // Backspace 처리 (빈 블록 삭제)
      if (e.key === "Backspace") {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const isAtStart = range.startOffset === 0 && range.collapsed;

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
      editorRef,
      getCaretPosition,
      insertLineBreak,
      onChange,
      onArrowDown,
      onArrowUp,
      onDelete,
      onEnter,
      onShiftTab,
      onTab,
      selectEntireBlock,
      setCaretPosition,
      setCommandMenuOpen,
      setFormatMenuOpen,
      value,
      restoreCaretPosition,
    ],
  );

  // 현재 커서가 텍스트 줄의 시작인지 확인
  const isTextLineStart = useCallback(() => {
    if (!editorRef.current) return true;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return true;

    const range = selection.getRangeAt(0);
    const text = editorRef.current.textContent || "";
    const cursorPos = range.startOffset;

    // 커서가 0이면 무조건 시작
    if (cursorPos === 0) return true;

    // 현재 위치 이전에 줄바꿈이 있는지 확인
    const textBeforeCursor = text.substring(0, cursorPos);
    const lastNewlinePos = textBeforeCursor.lastIndexOf("\n");

    // 마지막 줄바꿈 바로 다음이면 줄 시작
    return lastNewlinePos === cursorPos - 1;
  }, [editorRef]);

  // 현재 커서가 텍스트 줄의 끝인지 확인
  const isTextLineEnd = useCallback(() => {
    if (!editorRef.current) return true;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return true;

    const range = selection.getRangeAt(0);
    const text = editorRef.current.textContent || "";
    const cursorPos = range.startOffset;

    // 커서가 전체 텍스트 끝이면 무조건 끝
    if (cursorPos === text.length) return true;

    // 현재 위치 다음에 줄바꿈이 있는지 확인
    return text.charAt(cursorPos) === "\n";
  }, [editorRef]);

  // 현재 줄의 시작으로 이동
  const moveToLineStart = useCallback(() => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const text = editorRef.current.textContent || "";
    const cursorPos = range.startOffset;

    // 처음이면 그대로 유지
    if (cursorPos === 0) return;

    // 현재 위치 이전의 마지막 줄바꿈 위치 찾기
    const textBeforeCursor = text.substring(0, cursorPos);
    const lastNewlinePos = textBeforeCursor.lastIndexOf("\n");

    // 줄 시작 위치 계산
    const lineStartPos = lastNewlinePos === -1 ? 0 : lastNewlinePos + 1;

    // 캐럿 위치 설정
    setCaretPosition(lineStartPos);
  }, [editorRef, setCaretPosition]);

  // 현재 줄의 끝으로 이동
  const moveToLineEnd = useCallback(() => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const text = editorRef.current.textContent || "";
    const cursorPos = range.startOffset;

    // 끝이면 그대로 유지
    if (cursorPos === text.length) return;

    // 현재 위치 이후의 첫 줄바꿈 위치 찾기
    const nextNewlinePos = text.indexOf("\n", cursorPos);

    // 줄 끝 위치 계산
    const lineEndPos = nextNewlinePos === -1 ? text.length : nextNewlinePos;

    // 캐럿 위치 설정
    setCaretPosition(lineEndPos);
  }, [editorRef, setCaretPosition]);

  // 왼쪽으로 단어 단위 이동
  const moveWordLeft = useCallback(() => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const text = editorRef.current.textContent || "";
    const cursorPos = range.startOffset;

    // 처음이면 그대로 유지
    if (cursorPos === 0) return;

    // 현재 위치 이전의 마지막 단어 경계 찾기
    let newPos = cursorPos - 1;

    // 현재가 공백이면 이전 단어의 끝으로 이동
    if (/\s/.test(text.charAt(newPos))) {
      while (newPos > 0 && /\s/.test(text.charAt(newPos - 1))) {
        newPos--;
      }
    }

    // 이전 단어의 시작으로 이동
    while (newPos > 0 && !/\s/.test(text.charAt(newPos - 1))) {
      newPos--;
    }

    // 캐럿 위치 설정
    setCaretPosition(newPos);
  }, [editorRef, setCaretPosition]);

  // 오른쪽으로 단어 단위 이동
  const moveWordRight = useCallback(() => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const text = editorRef.current.textContent || "";
    const cursorPos = range.startOffset;

    // 끝이면 그대로 유지
    if (cursorPos === text.length) return;

    // 현재 위치 이후의 첫 단어 경계 찾기
    let newPos = cursorPos;

    // 현재 단어의 끝으로 이동
    while (newPos < text.length && !/\s/.test(text.charAt(newPos))) {
      newPos++;
    }

    // 다음 단어의 시작으로 이동 (공백 건너뛰기)
    while (newPos < text.length && /\s/.test(text.charAt(newPos))) {
      newPos++;
    }

    // 캐럿 위치 설정
    setCaretPosition(newPos);
  }, [editorRef, setCaretPosition]);

  // 줄 시작까지 선택
  const selectToLineStart = useCallback(() => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const text = editorRef.current.textContent || "";
    const cursorPos = range.startOffset;

    // 현재 위치 이전의 마지막 줄바꿈 위치 찾기
    const textBeforeCursor = text.substring(0, cursorPos);
    const lastNewlinePos = textBeforeCursor.lastIndexOf("\n");

    // 줄 시작 위치 계산
    const lineStartPos = lastNewlinePos === -1 ? 0 : lastNewlinePos + 1;

    // 새 범위 생성 (현재 위치부터 줄 시작까지)
    const newRange = document.createRange();
    const textNode = editorRef.current.firstChild || editorRef.current;

    newRange.setStart(textNode, lineStartPos);
    newRange.setEnd(textNode, cursorPos);

    // 선택 영역 설정
    selection.removeAllRanges();
    selection.addRange(newRange);
  }, [editorRef]);

  // 줄 끝까지 선택
  const selectToLineEnd = useCallback(() => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const text = editorRef.current.textContent || "";
    const cursorPos = range.startOffset;

    // 현재 위치 이후의 첫 줄바꿈 위치 찾기
    const nextNewlinePos = text.indexOf("\n", cursorPos);

    // 줄 끝 위치 계산
    const lineEndPos = nextNewlinePos === -1 ? text.length : nextNewlinePos;

    // 새 범위 생성 (현재 위치부터 줄 끝까지)
    const newRange = document.createRange();
    const textNode = editorRef.current.firstChild || editorRef.current;

    newRange.setStart(textNode, cursorPos);
    newRange.setEnd(textNode, lineEndPos);

    // 선택 영역 설정
    selection.removeAllRanges();
    selection.addRange(newRange);
  }, [editorRef]);

  // 왼쪽으로 단어 단위 선택
  const selectWordLeft = useCallback(() => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const text = editorRef.current.textContent || "";
    const cursorPos = range.startOffset;
    const endPos = range.endOffset;

    // 처음이면 그대로 유지
    if (cursorPos === 0) return;

    // 현재 위치 이전의 마지막 단어 경계 찾기
    let newPos = cursorPos - 1;

    // 현재가 공백이면 이전 단어의 끝으로 이동
    if (/\s/.test(text.charAt(newPos))) {
      while (newPos > 0 && /\s/.test(text.charAt(newPos - 1))) {
        newPos--;
      }
    }

    // 이전 단어의 시작으로 이동
    while (newPos > 0 && !/\s/.test(text.charAt(newPos - 1))) {
      newPos--;
    }

    // 새 범위 생성 (현재 선택 영역 유지하고 시작 위치만 조정)
    const newRange = document.createRange();
    const textNode = editorRef.current.firstChild || editorRef.current;

    newRange.setStart(textNode, newPos);
    newRange.setEnd(textNode, endPos);

    // 선택 영역 설정
    selection.removeAllRanges();
    selection.addRange(newRange);
  }, [editorRef]);

  // 오른쪽으로 단어 단위 선택
  const selectWordRight = useCallback(() => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const text = editorRef.current.textContent || "";
    const startPos = range.startOffset;
    const cursorPos = range.endOffset;

    // 끝이면 그대로 유지
    if (cursorPos === text.length) return;

    // 현재 위치 이후의 첫 단어 경계 찾기
    let newPos = cursorPos;

    // 현재 단어의 끝으로 이동
    while (newPos < text.length && !/\s/.test(text.charAt(newPos))) {
      newPos++;
    }

    // 다음 단어의 시작으로 이동 (공백 건너뛰기)
    while (newPos < text.length && /\s/.test(text.charAt(newPos))) {
      newPos++;
    }

    // 새 범위 생성 (현재 선택 영역 유지하고 끝 위치만 조정)
    const newRange = document.createRange();
    const textNode = editorRef.current.firstChild || editorRef.current;

    newRange.setStart(textNode, startPos);
    newRange.setEnd(textNode, newPos);

    // 선택 영역 설정
    selection.removeAllRanges();
    selection.addRange(newRange);
  }, [editorRef]);

  // 오른쪽으로 문자 단위 선택
  const selectCharRight = useCallback(() => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const text = editorRef.current.textContent || "";
    const startPos = range.startOffset;
    const endPos = range.endOffset;

    // 이미 끝이면 유지
    if (endPos >= text.length) return;

    // 새 범위 생성 (선택 영역 확장)
    const newRange = document.createRange();
    const textNode = editorRef.current.firstChild || editorRef.current;

    newRange.setStart(textNode, startPos);
    newRange.setEnd(textNode, endPos + 1);

    // 선택 영역 설정
    selection.removeAllRanges();
    selection.addRange(newRange);
  }, [editorRef]);

  // 왼쪽으로 문자 단위 선택
  const selectCharLeft = useCallback(() => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const startPos = range.startOffset;
    const endPos = range.endOffset;

    // 이미 처음이면 유지
    if (startPos <= 0) return;

    // 새 범위 생성 (선택 영역 확장)
    const newRange = document.createRange();
    const textNode = editorRef.current.firstChild || editorRef.current;

    newRange.setStart(textNode, startPos - 1);
    newRange.setEnd(textNode, endPos);

    // 선택 영역 설정
    selection.removeAllRanges();
    selection.addRange(newRange);
  }, [editorRef]);

  // 같은 열로 위쪽 줄로 이동
  const moveUpToSameColumn = useCallback(() => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const text = editorRef.current.textContent || "";
    const cursorPos = range.startOffset;

    // 현재 줄에서의 열(컬럼) 위치 계산
    const textBeforeCursor = text.substring(0, cursorPos);
    const lastNewlinePos = textBeforeCursor.lastIndexOf("\n");
    const currentLineStart = lastNewlinePos === -1 ? 0 : lastNewlinePos + 1;
    const columnPos = cursorPos - currentLineStart;

    // 이전 줄 찾기
    let prevLineStart = -1;
    if (lastNewlinePos > 0) {
      const textBeforeCurrentLine = text.substring(0, lastNewlinePos);
      prevLineStart = textBeforeCurrentLine.lastIndexOf("\n");
      prevLineStart = prevLineStart === -1 ? 0 : prevLineStart + 1;
    } else {
      // 첫 줄이면 줄 시작으로
      setCaretPosition(0);
      return;
    }

    // 이전 줄의 길이 계산
    const prevLineLength = lastNewlinePos - prevLineStart;

    // 같은 열 위치 또는 줄 끝으로 이동
    const newPos = prevLineStart + Math.min(columnPos, prevLineLength);
    setCaretPosition(newPos);
  }, [editorRef, setCaretPosition]);

  // 같은 열로 아래쪽 줄로 이동
  const moveDownToSameColumn = useCallback(() => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const text = editorRef.current.textContent || "";
    const cursorPos = range.startOffset;

    // 현재 줄에서의 열(컬럼) 위치 계산
    const textBeforeCursor = text.substring(0, cursorPos);
    const lastNewlinePos = textBeforeCursor.lastIndexOf("\n");
    const currentLineStart = lastNewlinePos === -1 ? 0 : lastNewlinePos + 1;
    const columnPos = cursorPos - currentLineStart;

    // 현재 줄의 끝 찾기
    const currentLineEnd = text.indexOf("\n", cursorPos);

    // 다음 줄이 없으면 현재 줄 끝으로
    if (currentLineEnd === -1) {
      setCaretPosition(text.length);
      return;
    }

    // 다음 줄의 시작
    const nextLineStart = currentLineEnd + 1;

    // 다음 줄의 끝 찾기
    const nextLineEnd = text.indexOf("\n", nextLineStart);
    const nextLineLength =
      nextLineEnd === -1
        ? text.length - nextLineStart
        : nextLineEnd - nextLineStart;

    // 같은 열 위치 또는 줄 끝으로 이동
    const newPos = nextLineStart + Math.min(columnPos, nextLineLength);
    setCaretPosition(newPos);
  }, [editorRef, setCaretPosition]);

  return { handleKeyDown };
}
