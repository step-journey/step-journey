import { useState, useRef, useCallback, useEffect } from "react";
import { Block } from "@/types/block";
import { EditorState, createBlockStart, SelectionState } from "@/lib/editor";

interface UseBlockSelectionOptions {
  blocks: Block[];
  onFocusChange?: (blockId: string | null) => void;
  editorState?: EditorState | null;
  editorController?: {
    updateSelection: (selection: SelectionState | null) => void;
  } | null;
}

/**
 * 블록 선택, 포커스 및 참조 관리를 위한 훅
 */
export function useBlockSelection({
  blocks,
  onFocusChange,
  editorState,
  editorController,
}: UseBlockSelectionOptions) {
  const [selectedBlockIds, setSelectedBlockIds] = useState<Set<string>>(
    new Set(),
  );
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const [clipboard, setClipboard] = useState<Block[]>([]);
  const blockRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  // 블록 선택
  const handleBlockSelect = useCallback(
    (blockId: string, multiSelect: boolean) => {
      if (multiSelect) {
        // 다중 선택 (Ctrl/Cmd + 클릭)
        setSelectedBlockIds((prev) => {
          const newSelection = new Set(prev);
          if (newSelection.has(blockId)) {
            newSelection.delete(blockId);
          } else {
            newSelection.add(blockId);
          }
          return newSelection;
        });
      } else {
        // 단일 선택
        setSelectedBlockIds(new Set([blockId]));
      }

      setFocusedBlockId(blockId);
      if (onFocusChange) onFocusChange(blockId);

      // EditorState 업데이트
      if (editorController) {
        const position = createBlockStart(blockId);
        editorController.updateSelection({
          anchor: position,
          focus: position,
          isCollapsed: true,
          isBackward: false,
        });
      }
    },
    [onFocusChange, editorController],
  );

  // 블록 포커스
  const focusBlock = useCallback(
    (blockId: string) => {
      setFocusedBlockId(blockId);
      if (onFocusChange) onFocusChange(blockId);

      // EditorState 업데이트
      if (editorController) {
        const position = createBlockStart(blockId);
        editorController.updateSelection({
          anchor: position,
          focus: position,
          isCollapsed: true,
          isBackward: false,
        });
      }

      // DOM이 업데이트된 후 포커스 적용
      setTimeout(() => {
        if (blockRefs.current[blockId]) {
          const editableDiv = blockRefs.current[blockId]?.querySelector(
            '[contenteditable="true"]',
          );

          if (editableDiv) {
            (editableDiv as HTMLElement).focus();

            // 커서를 마지막 위치로 이동
            const textContent = editableDiv.textContent || "";
            const selection = window.getSelection();
            if (selection) {
              const range = document.createRange();
              if (editableDiv.firstChild) {
                range.setStart(editableDiv.firstChild, textContent.length);
                range.setEnd(editableDiv.firstChild, textContent.length);
              } else {
                range.setStart(editableDiv, 0);
                range.setEnd(editableDiv, 0);
              }
              selection.removeAllRanges();
              selection.addRange(range);
            }
          }
        }
      }, 10);
    },
    [onFocusChange, editorController],
  );

  // 방향키로 블록 간 이동
  const navigateBlocks = useCallback(
    (direction: "up" | "down") => {
      if (!focusedBlockId) return;

      const currentIndex = blocks.findIndex((b) => b.id === focusedBlockId);
      if (currentIndex === -1) return;

      if (direction === "up" && currentIndex > 0) {
        focusBlock(blocks[currentIndex - 1].id);
      } else if (direction === "down" && currentIndex < blocks.length - 1) {
        focusBlock(blocks[currentIndex + 1].id);
      }
    },
    [blocks, focusBlock, focusedBlockId],
  );

  // 블록 참조 설정
  const setBlockRef = useCallback((id: string, el: HTMLElement | null) => {
    blockRefs.current[id] = el;
  }, []);

  // 선택한 블록을 클립보드에 복사
  const copySelectedBlocks = useCallback(() => {
    const selectedBlocks = blocks.filter((block) =>
      selectedBlockIds.has(block.id),
    );
    setClipboard(selectedBlocks);
    return selectedBlocks;
  }, [blocks, selectedBlockIds]);

  // 선택 초기화
  const clearSelection = useCallback(() => {
    setSelectedBlockIds(new Set());
    // EditorState도 초기화
    if (editorController) {
      editorController.updateSelection(null);
    }
  }, [editorController]);

  // EditorState의 selection 변경 감지
  useEffect(() => {
    if (editorState?.selection) {
      const { anchor } = editorState.selection;

      // 현재 포커스된 블록이 에디터 상태의 포커스와 다르면 업데이트
      if (anchor.blockId !== focusedBlockId) {
        setFocusedBlockId(anchor.blockId);
        setSelectedBlockIds(new Set([anchor.blockId]));
      }
    }
  }, [editorState?.selection, focusedBlockId]);

  return {
    selectedBlockIds,
    setSelectedBlockIds,
    focusedBlockId,
    setFocusedBlockId,
    clipboard,
    setClipboard,
    blockRefs,
    handleBlockSelect,
    focusBlock,
    navigateBlocks,
    setBlockRef,
    copySelectedBlocks,
    clearSelection,
  };
}
