import React, { useState, useRef, useEffect, useCallback } from "react";
import { BlockType, TextFormat } from "@/types/block";
import { cn } from "@/lib/utils";
import SlashCommandMenu from "./SlashCommandMenu";
import FormatMenu from "./text/FormatMenu";
import { useTextFormatting } from "./hooks/useTextFormatting";
import { useTextEditorKeydown } from "./hooks/useTextEditorKeydown";
import { useTextCommands } from "./hooks/useTextCommands";

interface TextEditorProps {
  value: Array<[string, Array<TextFormat>]>;
  onChange: (value: Array<[string, Array<TextFormat>]>) => void;
  blockType: BlockType;
  onEnter?: (e?: any) => void;
  onTab?: () => void;
  onShiftTab?: () => void;
  onDelete?: () => void;
  onChangeType?: (type: BlockType) => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  placeholder?: string;
}

export default function TextEditor({
  value,
  onChange,
  blockType,
  onEnter,
  onTab,
  onShiftTab,
  onDelete,
  onChangeType,
  onArrowUp,
  onArrowDown,
  placeholder = "Type '/' for commands...",
}: TextEditorProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [formatMenuOpen, setFormatMenuOpen] = useState(false);
  const [formatMenuPosition, setFormatMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const selectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastClickTimeRef = useRef<number>(0);

  // 에디터 초기화
  useEffect(() => {
    if (editorRef.current) {
      const text = value[0]?.[0] || "";

      // 실제로 필요한 경우에만 내용 업데이트
      if (
        editorRef.current.textContent !== text &&
        !editorRef.current.contains(document.activeElement)
      ) {
        // 편집기에 포커스가 없을 때만 내용 교체
        editorRef.current.textContent = text;
      }
    }
  }, [value]);

  useEffect(() => {
    const editorElement = editorRef.current;
    if (!editorElement) return;

    const handleKeyDownEvent = (e: KeyboardEvent) => {
      // Arrow key handling for cursor position maintenance
      if (e.key === "ArrowUp" && isFirstLine(editorElement)) {
        const cursorPos = getCursorPosition();
        if (cursorPos) {
          // Save the current horizontal position for when we move to the previous block
          const column = getColumnPosition(cursorPos);
          localStorage.setItem("caretColumn", column.toString());
        }
      } else if (e.key === "ArrowDown" && isLastLine(editorElement)) {
        const cursorPos = getCursorPosition();
        if (cursorPos) {
          // Save the current horizontal position for when we move to the next block
          const column = getColumnPosition(cursorPos);
          localStorage.setItem("caretColumn", column.toString());
        }
      }
    };

    // Helper functions for cursor position
    const isFirstLine = (element: HTMLElement) => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return false;

      const range = selection.getRangeAt(0);
      const text = element.textContent || "";
      const cursorPos = range.startOffset;

      // If there's no newline or cursor is before the first newline
      return text.indexOf("\n") === -1 || cursorPos <= text.indexOf("\n");
    };

    const isLastLine = (element: HTMLElement) => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return false;

      const range = selection.getRangeAt(0);
      const text = element.textContent || "";
      const cursorPos = range.startOffset;
      const lastNewlinePos = text.lastIndexOf("\n");

      // If there's no newline or cursor is after the last newline
      return lastNewlinePos === -1 || cursorPos > lastNewlinePos;
    };

    const getCursorPosition = (): number | null => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return null;

      const range = selection.getRangeAt(0);
      return range.startOffset;
    };

    const getColumnPosition = (cursorPos: number): number => {
      const text = editorElement.textContent || "";
      const textBeforeCursor = text.substring(0, cursorPos);
      const lastNewlinePos = textBeforeCursor.lastIndexOf("\n");

      // If there's no newline, cursor column is just the cursor position
      // Otherwise, it's the position relative to the last newline
      return lastNewlinePos === -1 ? cursorPos : cursorPos - lastNewlinePos - 1;
    };

    editorElement.addEventListener("keydown", handleKeyDownEvent);
    return () => {
      editorElement.removeEventListener("keydown", handleKeyDownEvent);
    };
  }, [editorRef]);

  // 텍스트 포맷팅 훅
  const {
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
    setCaretPosition,
    getCaretPosition,
    saveCaretPosition,
    restoreCaretPosition,
  } = useTextFormatting({
    editorRef,
    value,
    onChange,
    blockType,
    onChangeType,
  });

  // 커서를 텍스트 끝으로 이동 (공개 메서드)
  const handleMoveCursorToEnd = useCallback(() => {
    moveCursorToEnd();
  }, [moveCursorToEnd]);

  // 단축키 서식 적용
  const applyShortcutFormat = useCallback(
    (key: string) => {
      const savedCaretPos = saveCaretPosition();

      switch (key) {
        case "b":
          applyFormat(["b"]);
          break;
        case "i":
          applyFormat(["i"]);
          break;
        case "u":
          applyFormat(["u"]);
          break;
        case "e":
          applyFormat(["c"]);
          break; // 코드 블록
        case "k":
          promptForLink();
          break; // 링크
      }

      // 서식 적용 후 커서 위치 복원
      setTimeout(() => restoreCaretPosition(savedCaretPos), 0);
    },
    [applyFormat, promptForLink, saveCaretPosition, restoreCaretPosition],
  );

  // 텍스트 명령어 처리 훅
  const {
    commandMenuOpen,
    setCommandMenuOpen,
    searchTerm,
    menuPosition,
    handleInput: handleCommandInput,
    handleSelectBlockType,
    closeCommandMenu,
  } = useTextCommands({
    editorRef,
    onChange,
    onChangeType,
    moveCursorToEnd,
  });

  // 키보드 이벤트 처리 훅
  const { handleKeyDown } = useTextEditorKeydown({
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
  });

  // 텍스트 입력 처리
  const handleInput = useCallback(() => {
    if (!editorRef.current) return;
    const text = editorRef.current.textContent || "";

    // 커서 위치 저장
    const caretPosition = getCaretPosition();

    // 커맨드 메뉴 처리
    handleCommandInput();

    // 마크다운 자동 변환 처리
    processMarkdown(text);

    // 변환 후에도 커서 위치가 바뀌지 않게 복원
    setTimeout(() => {
      if (caretPosition) {
        restoreCaretPosition(caretPosition);
      }
    }, 0);
  }, [
    handleCommandInput,
    processMarkdown,
    getCaretPosition,
    restoreCaretPosition,
  ]);

  // 클릭 처리
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const now = Date.now();
      const clickDiff = now - lastClickTimeRef.current;
      lastClickTimeRef.current = now;

      // 더블 클릭 처리 (단어 선택)
      if (clickDiff < 300 && clickDiff > 0) {
        selectWord();
        e.preventDefault();
      }
      // 트리플 클릭 처리 (블록 전체 선택)
      else if (clickDiff < 600 && clickDiff > 0) {
        selectEntireBlock();
        e.preventDefault();
      }
    },
    [selectWord, selectEntireBlock],
  );

  // 포맷 메뉴 표시/위치 설정
  const handleSelectText = useCallback(() => {
    if (selectionTimeoutRef.current) {
      clearTimeout(selectionTimeoutRef.current);
    }

    selectionTimeoutRef.current = setTimeout(() => {
      const selection = detectSelection();

      if (selection) {
        // 선택 영역에 대한 메뉴 표시
        const range = window.getSelection()?.getRangeAt(0);
        if (range) {
          const rect = range.getBoundingClientRect();
          setFormatMenuPosition({
            top: rect.bottom + window.scrollY + 5,
            left: rect.left + window.scrollX + rect.width / 2,
          });
          setFormatMenuOpen(true);
        }
      } else {
        setFormatMenuOpen(false);
      }
    }, 50); // 짧은 딜레이로 선택이 완료된 후 메뉴 표시
  }, [detectSelection]);

  // 붙여넣기 처리
  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();

      // 클립보드 텍스트 가져오기
      const text = e.clipboardData.getData("text/plain");

      // 현재 선택 영역 가져오기
      const selection = window.getSelection();
      if (!selection?.rangeCount) return;

      // 선택 영역 대체
      const range = selection.getRangeAt(0);
      range.deleteContents();

      // 텍스트 삽입
      const textNode = document.createTextNode(text);
      range.insertNode(textNode);

      // 커서 위치를 삽입된 텍스트 끝으로 이동
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      selection.removeAllRanges();
      selection.addRange(range);

      // 값 업데이트
      if (editorRef.current) {
        onChange([[editorRef.current.textContent || "", []]]);
      }
    },
    [onChange],
  );

  // 에디터 클래스 계산
  const editorClasses = cn(
    "outline-none min-h-[1.5em] px-1 whitespace-pre-wrap break-words transition-colors",
    blockType === "heading_1" && "text-3xl font-bold my-2",
    blockType === "heading_2" && "text-2xl font-bold my-2",
    blockType === "heading_3" && "text-xl font-bold my-1.5",
    blockType === "quote" && "italic",
    (!value[0][0] || value[0][0] === "/") &&
      !isFocused &&
      "text-muted-foreground",
  );

  return (
    <div className={cn("text-editor relative w-full")}>
      <div
        ref={editorRef}
        className={editorClasses}
        contentEditable
        suppressContentEditableWarning
        onFocus={() => {
          setIsFocused(true);
          // 포커스 시 커서 위치 복원 또는 기본 위치로 이동
          if (editorRef.current?.textContent === "") {
            setTimeout(handleMoveCursorToEnd, 0);
          }
        }}
        onBlur={() => {
          setIsFocused(false);

          if (!menuPosition) {
            setCommandMenuOpen(false);
          }

          setTimeout(() => {
            setFormatMenuOpen(false);
          }, 100);
        }}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
        onMouseUp={handleSelectText}
        onSelect={handleSelectText}
        onPaste={handlePaste}
        data-placeholder={isFocused && !value[0][0] ? placeholder : ""}
      />

      {/* 커맨드 메뉴 */}
      {commandMenuOpen && (
        <SlashCommandMenu
          onSelect={handleSelectBlockType}
          onClose={closeCommandMenu}
          searchTerm={searchTerm}
          position={menuPosition}
        />
      )}

      {/* 텍스트 포맷 메뉴 */}
      <FormatMenu
        isOpen={formatMenuOpen}
        position={formatMenuPosition}
        activeFormats={activeFormats}
        onFormatClick={applyFormat}
        onLinkClick={promptForLink}
      />
    </div>
  );
}
