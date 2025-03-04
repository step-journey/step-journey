import { useCallback, useEffect } from "react";

interface UseBlockHotkeysOptions {
  onUndo: () => Promise<void>;
  onCopy: () => void;
  onPaste: () => Promise<void>;
  onDuplicate: () => Promise<void>;
  onDelete: () => Promise<void>;
  hasSelection: boolean;
  hasFocus: boolean;
  hasClipboard: boolean;
  canDuplicate: boolean;
}

/**
 * 블록 에디터 단축키 처리를 위한 훅
 */
export function useBlockHotkeys({
  onUndo,
  onCopy,
  onPaste,
  onDuplicate,
  onDelete,
  hasSelection,
  hasFocus,
  hasClipboard,
  canDuplicate,
}: UseBlockHotkeysOptions) {
  // 단축키 핸들러 등록
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const isModKey = e.metaKey || e.ctrlKey;

      // 실행 취소 (Ctrl/Cmd + Z)
      if (isModKey && e.key === "z") {
        e.preventDefault();
        onUndo();
        return;
      }

      // 복사 (Ctrl/Cmd + C)
      if (isModKey && e.key === "c" && hasSelection) {
        e.preventDefault();
        onCopy();
        return;
      }

      // 붙여넣기 (Ctrl/Cmd + V)
      if (isModKey && e.key === "v" && hasClipboard && hasFocus) {
        e.preventDefault();
        onPaste();
        return;
      }

      // 복제 (Ctrl/Cmd + D)
      if (isModKey && e.key === "d" && canDuplicate) {
        e.preventDefault();
        onDuplicate();
        return;
      }

      // 삭제 (Delete/Backspace)
      if ((e.key === "Delete" || e.key === "Backspace") && hasSelection) {
        // 블록 내부 편집이 아닌 경우에만 실행
        const selection = window.getSelection();
        if (selection && selection.toString() === "") {
          e.preventDefault();
          onDelete();
          return;
        }
      }
    },
    [
      onUndo,
      onCopy,
      onPaste,
      onDuplicate,
      onDelete,
      hasSelection,
      hasFocus,
      hasClipboard,
      canDuplicate,
    ],
  );

  // 이벤트 리스너 등록
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);
}
