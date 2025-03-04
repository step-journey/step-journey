import { useState, useRef, useEffect, KeyboardEvent, useCallback } from "react";
import { BlockType, TextFormat } from "@/types/block";
import { cn } from "@/lib/utils";
import CommandMenu from "./CommandMenu";
import { createPortal } from "react-dom";
import {
  IconBold,
  IconItalic,
  IconUnderline,
  IconStrikethrough,
  IconCode,
  IconLink,
  IconHighlight,
} from "@tabler/icons-react";

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
  const [commandMenuOpen, setCommandMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [selectedRange, setSelectedRange] = useState<{
    start: number;
    end: number;
  } | null>(null);
  const [formatMenuOpen, setFormatMenuOpen] = useState(false);
  const [formatMenuPosition, setFormatMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [activeFormats, setActiveFormats] = useState<TextFormat[]>([]);
  const editorRef = useRef<HTMLDivElement>(null);
  const lastKeyPressTime = useRef<number>(0);

  // 에디터 초기화
  useEffect(() => {
    if (editorRef.current) {
      const text = value[0]?.[0] || "";

      // Only update the content if actually needed
      if (
        editorRef.current.textContent !== text &&
        !editorRef.current.contains(document.activeElement)
      ) {
        // Only replace content when the editor doesn't have focus
        editorRef.current.textContent = text;
      }
    }
  }, [value]);

  // 텍스트 포맷 감지 (선택 시)
  const detectFormats = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      setFormatMenuOpen(false);
      return;
    }

    // 선택 영역 저장
    const range = selection.getRangeAt(0);
    setSelectedRange({
      start: range.startOffset,
      end: range.endOffset,
    });

    // 선택 영역 텍스트가 비어있지 않을 때만 포맷 메뉴 표시
    if (range.toString().trim()) {
      // 메뉴 위치 계산
      const rect = range.getBoundingClientRect();
      setFormatMenuPosition({
        top: rect.bottom + window.scrollY + 5,
        left: rect.left + window.scrollX + rect.width / 2,
      });
      setFormatMenuOpen(true);

      // 현재 적용된 포맷 감지
      // 이 예시에서는 단순화를 위해 빈 배열 반환
      setActiveFormats([]);
    } else {
      setFormatMenuOpen(false);
    }
  }, []);

  // 커서를 텍스트 끝으로 이동
  const moveCursorToEnd = useCallback(() => {
    if (!editorRef.current) return;

    // Only set selection if the div has content
    const selection = window.getSelection();
    if (!selection) return;

    const range = document.createRange();

    // If there's text content
    if (editorRef.current.firstChild && editorRef.current.textContent) {
      // Get the last text node
      const lastNode = editorRef.current.lastChild;
      // If it's a text node, put cursor at the end
      if (lastNode && lastNode.nodeType === Node.TEXT_NODE) {
        const textNode = lastNode as Text;
        const length = textNode.textContent?.length || 0;
        range.setStart(textNode, length);
        range.setEnd(textNode, length);
      } else {
        // If it's not a text node, append an empty text node
        const textNode = document.createTextNode("");
        editorRef.current.appendChild(textNode);
        range.setStart(textNode, 0);
        range.setEnd(textNode, 0);
      }
    } else {
      // If no content, create a text node
      const textNode = document.createTextNode("");
      editorRef.current.appendChild(textNode);
      range.setStart(textNode, 0);
      range.setEnd(textNode, 0);
    }

    selection.removeAllRanges();
    selection.addRange(range);
  }, []);

  // 포맷 적용 함수
  const applyFormat = (formatType: TextFormat) => {
    if (!selectedRange || !editorRef.current) return;

    const text = editorRef.current.textContent || "";

    // 여기서는 단순화를 위해 텍스트만 변경하지만,
    // 실제로는 Notion 방식으로 포맷 배열에 추가해야 함

    // 변경된 내용을 부모에게 알림
    const newValue: Array<[string, Array<TextFormat>]> = [[text, []]];
    onChange(newValue);

    // 포맷 메뉴 닫기
    setFormatMenuOpen(false);
  };

  // 마크다운 자동 변환
  const processMarkdown = (text: string) => {
    // Markdown 자동 변환 기능 규칙
    // 입력 > 변환 패턴
    const markdownRules = [
      // 제목
      { pattern: /^# (.+)$/, action: () => onChangeType?.("heading_1") },
      { pattern: /^## (.+)$/, action: () => onChangeType?.("heading_2") },
      { pattern: /^### (.+)$/, action: () => onChangeType?.("heading_3") },

      // 목록
      { pattern: /^- (.+)$/, action: () => onChangeType?.("bulleted_list") },
      { pattern: /^\* (.+)$/, action: () => onChangeType?.("bulleted_list") },
      { pattern: /^1\. (.+)$/, action: () => onChangeType?.("numbered_list") },

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

    // 텍스트에 스페이스가 포함되어 있는지 확인 (변환 트리거)
    if (text.endsWith(" ")) {
      const textWithoutSpace = text.slice(0, -1);

      // 마크다운 규칙 확인
      for (const rule of markdownRules) {
        if (rule.pattern.test(textWithoutSpace)) {
          // 일치하는 패턴이 있으면 해당 액션 실행
          rule.action();

          // 특수 문자 제거하고 내용만 반환
          const match = textWithoutSpace.match(rule.pattern);
          if (match && match[1]) {
            // 변환 후 텍스트를 설정
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
  };

  // 텍스트 입력 처리
  const handleInput = () => {
    if (!editorRef.current) return;
    const text = editorRef.current.textContent || "";

    // '/' 커맨드 처리
    if (text.startsWith("/") && !commandMenuOpen) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        // Calculate position based on the cursor's position
        setMenuPosition({
          top: rect.bottom + window.scrollY,
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

    // 마크다운 자동 변환 처리
    const processed = processMarkdown(text);

    // 변경 사항을 부모에게 전달
    if (!processed) {
      onChange([[text, []]]);
    }
  };

  // 키 입력 처리
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const now = Date.now();
    // 미사용 변수 주석 처리 또는 _ 접두사 추가
    // const timeSinceLastKeyPress = now - lastKeyPressTime.current;
    lastKeyPressTime.current = now;

    // 커맨드 메뉴가 열려있을 때 특수 키 처리
    if (commandMenuOpen) {
      if (["ArrowUp", "ArrowDown", "Enter", "Escape"].includes(e.key)) {
        e.preventDefault();
        return;
      }
    }

    // 포맷 메뉴가 열려있을 때 Escape로 닫기
    if (formatMenuOpen && e.key === "Escape") {
      e.preventDefault();
      setFormatMenuOpen(false);
      return;
    }

    // Enter 키 처리
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      // code 블록 내부일 경우 다르게 처리
      if (blockType === "code") {
        // 코드 블록 내에서는 줄바꿈 삽입
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
            const textNode = editorRef.current.firstChild || editorRef.current;
            newRange.setStart(textNode, cursorPos + 1);
            newRange.setEnd(textNode, cursorPos + 1);
            selection.removeAllRanges();
            selection.addRange(newRange);

            // 변경 사항을 부모에게 전달
            onChange([[newText, []]]);
          }
        }
      } else if (onEnter) {
        // 일반 블록은 새 블록 생성
        onEnter(e);
      }
      return;
    }

    // Shift+Enter 처리 (줄바꿈)
    if (e.key === "Enter" && e.shiftKey) {
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
          const textNode = editorRef.current.firstChild || editorRef.current;
          newRange.setStart(textNode, cursorPos + 1);
          newRange.setEnd(textNode, cursorPos + 1);
          selection.removeAllRanges();
          selection.addRange(newRange);

          // 변경 사항을 부모에게 전달
          onChange([[newText, []]]);
        }
      }
      return;
    }

    // Tab/Shift+Tab 처리
    if (e.key === "Tab") {
      e.preventDefault();
      if (e.shiftKey) {
        onShiftTab?.();
      } else {
        onTab?.();
      }
      return;
    }

    // 방향키(위/아래) 처리
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
      switch (e.key) {
        case "b": // 굵게
          e.preventDefault();
          applyFormat(["b"]);
          return;
        case "i": // 기울임
          e.preventDefault();
          applyFormat(["i"]);
          return;
        case "u": // 밑줄
          e.preventDefault();
          applyFormat(["u"]);
          return;
        case "e": // 인라인 코드 (ctrl+e 사용)
          e.preventDefault();
          applyFormat(["c"]);
          return;
        case "k": // 링크
          e.preventDefault();
          promptForLink();
          return;
      }
    }
  };

  // 링크 삽입을 위한 프롬프트
  const promptForLink = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    // 미사용 변수는 사용하거나 제거
    // 여기서는 변수가 사용될 수 있는 예시 코드가 있으므로 유지합니다
    const range = selection.getRangeAt(0);
    // 링크 범위 확인 로직이 있다면 여기서 range 사용

    // 간단한 구현을 위해 window.prompt 사용
    // 실제로는 사용자 정의 모달 컴포넌트 사용 권장
    const url = window.prompt("링크 URL을 입력하세요:", "https://");

    if (url && url.trim() !== "") {
      // 선택한 텍스트에 링크 서식 적용
      applyFormat(["a", url]);
    }
  };

  // 블록 타입 변경
  const handleSelectBlockType = (type: BlockType) => {
    setCommandMenuOpen(false);
    if (editorRef.current) {
      editorRef.current.textContent = "";
      onChange([["", []]]);
    }
    onChangeType?.(type);
  };

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
          setTimeout(() => {
            moveCursorToEnd();
          }, 0);
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
        onMouseUp={detectFormats}
        onSelect={detectFormats}
        data-placeholder={isFocused && !value[0][0] ? placeholder : ""}
      />

      {/* 커맨드 메뉴 */}
      {commandMenuOpen && (
        <CommandMenu
          onSelect={handleSelectBlockType}
          onClose={() => setCommandMenuOpen(false)}
          searchTerm={searchTerm}
          position={menuPosition}
        />
      )}

      {/* 텍스트 포맷 메뉴 (선택 시 표시) */}
      {formatMenuOpen &&
        formatMenuPosition &&
        createPortal(
          <div
            className="fixed bg-background border border-border shadow-md rounded-md flex items-center p-1 z-50"
            style={{
              top: `${formatMenuPosition.top}px`,
              left: `${formatMenuPosition.left}px`,
              transform: "translateX(-50%)",
            }}
          >
            <button
              className={cn(
                "p-1.5 rounded hover:bg-accent/50",
                activeFormats.some((f) => f[0] === "b") && "bg-accent",
              )}
              onClick={() => applyFormat(["b"])}
              title="굵게 (Ctrl+B)"
            >
              <IconBold className="h-4 w-4" />
            </button>
            <button
              className={cn(
                "p-1.5 rounded hover:bg-accent/50",
                activeFormats.some((f) => f[0] === "i") && "bg-accent",
              )}
              onClick={() => applyFormat(["i"])}
              title="기울임 (Ctrl+I)"
            >
              <IconItalic className="h-4 w-4" />
            </button>
            <button
              className={cn(
                "p-1.5 rounded hover:bg-accent/50",
                activeFormats.some((f) => f[0] === "u") && "bg-accent",
              )}
              onClick={() => applyFormat(["u"])}
              title="밑줄 (Ctrl+U)"
            >
              <IconUnderline className="h-4 w-4" />
            </button>
            <button
              className={cn(
                "p-1.5 rounded hover:bg-accent/50",
                activeFormats.some((f) => f[0] === "s") && "bg-accent",
              )}
              onClick={() => applyFormat(["s"])}
              title="취소선"
            >
              <IconStrikethrough className="h-4 w-4" />
            </button>
            <button
              className={cn(
                "p-1.5 rounded hover:bg-accent/50",
                activeFormats.some((f) => f[0] === "c") && "bg-accent",
              )}
              onClick={() => applyFormat(["c"])}
              title="코드 (Ctrl+E)"
            >
              <IconCode className="h-4 w-4" />
            </button>
            <button
              className={cn(
                "p-1.5 rounded hover:bg-accent/50",
                activeFormats.some((f) => f[0] === "a") && "bg-accent",
              )}
              onClick={promptForLink}
              title="링크 (Ctrl+K)"
            >
              <IconLink className="h-4 w-4" />
            </button>
            <button
              className={cn(
                "p-1.5 rounded hover:bg-accent/50",
                activeFormats.some((f) => f[0] === "h") && "bg-accent",
              )}
              onClick={() => applyFormat(["h", "yellow"])}
              title="형광펜"
            >
              <IconHighlight className="h-4 w-4" />
            </button>
          </div>,
          document.body,
        )}
    </div>
  );
}
