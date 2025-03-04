import { useState, useRef, useEffect, useCallback } from "react";
import { BlockType, TextFormat } from "@/types/block";
import { cn } from "@/lib/utils";
import CommandMenu from "./CommandMenu";
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
    },
    [applyFormat, promptForLink],
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
  });

  // 텍스트 입력 처리
  const handleInput = useCallback(() => {
    if (!editorRef.current) return;
    const text = editorRef.current.textContent || "";

    // 커맨드 메뉴 처리
    handleCommandInput();

    // 마크다운 자동 변환 처리
    processMarkdown(text);
  }, [handleCommandInput, processMarkdown]);

  // 포맷 메뉴 표시/위치 설정
  const handleSelectText = useCallback(() => {
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
  }, [detectSelection]);

  // 에디터 클래스 계산
  const editorClasses = cn(
    "outline-none min-h-[1.5em] px-1 whitespace-pre-wrap break-words",
    blockType === "heading_1" && "text-3xl font-bold my-2",
    blockType === "heading_2" && "text-2xl font-bold my-2",
    blockType === "heading_3" && "text-xl font-bold my-1.5",
    blockType === "quote" && "italic",
    blockType === "code" && "font-mono",
    (!value[0][0] || value[0][0] === "/") &&
      !isFocused &&
      "text-muted-foreground",
  );

  return (
    <div className="relative w-full">
      <div
        ref={editorRef}
        className={editorClasses}
        contentEditable
        suppressContentEditableWarning
        onFocus={() => {
          setIsFocused(true);
          setTimeout(handleMoveCursorToEnd, 0);
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
        onMouseUp={handleSelectText}
        onSelect={handleSelectText}
        data-placeholder={isFocused && !value[0][0] ? placeholder : ""}
      />

      {/* 커맨드 메뉴 */}
      {commandMenuOpen && (
        <CommandMenu
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
