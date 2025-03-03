import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { BlockType, TextFormat } from "@/types/block";
import { cn } from "@/lib/utils";
import CommandMenu from "./CommandMenu";

interface TextEditorProps {
  value: Array<[string, Array<TextFormat>]>;
  onChange: (value: Array<[string, Array<TextFormat>]>) => void;
  blockType: BlockType;
  onEnter?: () => void;
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
  placeholder = "글을 작성하세요. AI를 사용하려면 '스페이스' 키를, 명령어를 사용하려면 '/ '키를 누르세요...",
}: TextEditorProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [commandMenuOpen, setCommandMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const editorClasses = cn(
    "outline-none",
    // heading 스타일은 BlockComponent에서 h태그로 감싸므로 여기선 일반 텍스트 스타일 유지
    blockType === "quote" && "italic pl-4 border-l-4 border-accent",
    blockType === "code" && "font-mono bg-muted p-2 rounded",
  );

  useEffect(() => {
    if (editorRef.current) {
      const text = value[0][0] || "";
      if (
        !editorRef.current.textContent ||
        editorRef.current.textContent !== text
      ) {
        editorRef.current.textContent = text;
      }
    }
  }, [value]);

  const moveCursorToEnd = () => {
    if (!editorRef.current) return;
    if (!editorRef.current.firstChild) {
      editorRef.current.appendChild(document.createTextNode(""));
    }
    const selection = window.getSelection();
    if (!selection) return;

    const range = document.createRange();
    const textNode = editorRef.current.firstChild as Text;
    const length = textNode.length;

    range.setStart(textNode, length);
    range.setEnd(textNode, length);

    selection.removeAllRanges();
    selection.addRange(range);
  };

  const handleInput = () => {
    if (!editorRef.current) return;
    const text = editorRef.current.textContent || "";

    if (text.startsWith("/") && !commandMenuOpen) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setMenuPosition({
          top: rect.bottom + window.scrollY + 5,
          left: rect.left + window.scrollX,
        });
        setCommandMenuOpen(true);
        setSearchTerm(text.substring(1));
      }
    } else if (commandMenuOpen && text.startsWith("/")) {
      setSearchTerm(text.substring(1));
    } else if (!text.startsWith("/") && commandMenuOpen) {
      setCommandMenuOpen(false);
    }

    onChange([[text, []]]);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (commandMenuOpen) {
      if (["ArrowUp", "ArrowDown", "Enter", "Escape"].includes(e.key)) {
        e.preventDefault();
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onEnter?.();
      return;
    }

    if (e.key === "Tab" && !e.shiftKey) {
      e.preventDefault();
      onTab?.();
      return;
    }

    if (e.key === "Tab" && e.shiftKey) {
      e.preventDefault();
      onShiftTab?.();
      return;
    }

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
          return;
        }
      }
    }

    if (e.key === "ArrowDown") {
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
          return;
        }
      }
    }

    if (
      e.key === "Backspace" &&
      editorRef.current?.textContent === "" &&
      onDelete
    ) {
      e.preventDefault();
      onDelete();
      return;
    }
  };

  const handleSelectBlockType = (type: BlockType) => {
    setCommandMenuOpen(false);
    if (editorRef.current) {
      editorRef.current.textContent = "";
      onChange([["", []]]);
    }
    onChangeType?.(type);
  };

  const handleCloseCommandMenu = () => {
    setCommandMenuOpen(false);
    setMenuPosition(null);
  };

  return (
    <div className="relative">
      <div
        ref={editorRef}
        className={cn(
          editorClasses,
          "min-h-[1.5em] px-1 whitespace-pre-wrap break-words",
          (!value[0][0] || value[0][0] === "/") &&
            !isFocused &&
            "text-muted-foreground",
        )}
        contentEditable
        suppressContentEditableWarning
        onFocus={() => {
          setIsFocused(true);
          setTimeout(() => {
            moveCursorToEnd();
          }, 0);
        }}
        onBlur={() => {
          setIsFocused(false);
          if (!menuPosition) {
            setCommandMenuOpen(false);
          }
        }}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        data-placeholder={isFocused && !value[0][0] ? placeholder : ""}
      />

      {commandMenuOpen && (
        <CommandMenu
          onSelect={handleSelectBlockType}
          onClose={handleCloseCommandMenu}
          searchTerm={searchTerm}
          position={menuPosition}
        />
      )}
    </div>
  );
}
