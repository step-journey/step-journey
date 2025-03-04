import React, { useState, useCallback } from "react";
import { BlockType } from "@/types/block";

interface UseTextCommandsOptions {
  editorRef: React.RefObject<HTMLDivElement>;
  onChange: (value: Array<[string, any[]]>) => void;
  onChangeType?: (type: BlockType) => void;
  moveCursorToEnd: () => void;
}

/**
 * 슬래시(/) 명령어 처리를 위한 훅
 */
export function useTextCommands({
  editorRef,
  onChange,
  onChangeType,
  moveCursorToEnd,
}: UseTextCommandsOptions) {
  const [commandMenuOpen, setCommandMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  // 텍스트 입력 감지하여 커맨드 메뉴 표시 여부 결정
  const handleInput = useCallback(() => {
    if (!editorRef.current) return;
    const text = editorRef.current.textContent || "";

    // '/' 커맨드 처리
    if (text.startsWith("/") && !commandMenuOpen) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        // 계산된 위치 기반으로 메뉴 표시
        setMenuPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
        });
        setCommandMenuOpen(true);
        setSearchTerm(text.substring(1));
      }
    } else if (commandMenuOpen && text.startsWith("/")) {
      // 이미 열린 경우 검색어 업데이트
      setSearchTerm(text.substring(1));
    } else if (!text.startsWith("/") && commandMenuOpen) {
      // '/'로 시작하지 않으면 커맨드 메뉴 닫기
      setCommandMenuOpen(false);
    }

    // 일반 텍스트 입력 처리
    onChange([[text, []]]);
  }, [commandMenuOpen, editorRef, onChange]);

  // 블록 타입 선택 처리
  const handleSelectBlockType = useCallback(
    (type: BlockType) => {
      setCommandMenuOpen(false);

      if (editorRef.current) {
        // 에디터 내용 초기화
        editorRef.current.textContent = "";
        onChange([["", []]]);
      }

      // 블록 타입 변경
      if (onChangeType) {
        onChangeType(type);
      }
    },
    [editorRef, onChange, onChangeType],
  );

  // 커맨드 메뉴 닫기
  const closeCommandMenu = useCallback(() => {
    setCommandMenuOpen(false);
    setMenuPosition(null);
  }, []);

  return {
    commandMenuOpen,
    setCommandMenuOpen,
    searchTerm,
    menuPosition,
    handleInput,
    handleSelectBlockType,
    closeCommandMenu,
  };
}
