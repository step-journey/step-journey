import React, { useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import BlockList from "./BlockList";
import BlockEditorToolbar from "./toolbar/BlockEditorToolbar";
import { useBlockOperations } from "./hooks/useBlockOperations";
import { useBlockSelection } from "./hooks/useBlockSelection";
import { useDragAndDrop } from "./hooks/useDragAndDrop";

interface BlockEditorProps {
  pageId: string;
  className?: string;
}

export default function BlockEditor({ pageId, className }: BlockEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  // 블록 CRUD 작업 관련 훅
  const {
    blocks,
    isLoading,
    loadBlocks,
    addBlock,
    updateBlock,
    deleteBlock,
    deleteMultipleBlocks,
    duplicateBlock,
    moveBlock,
    moveBlockToParent,
    indentBlock,
    outdentBlock,
    pasteBlocks,
  } = useBlockOperations(pageId);

  // Load blocks when component mounts
  useEffect(() => {
    loadBlocks();
  }, [loadBlocks, pageId]);

  // 블록 선택 관련 훅
  const {
    selectedBlockIds,
    focusedBlockId,
    clipboard,
    blockRefs,
    handleBlockSelect,
    focusBlock,
    navigateBlocks,
    setBlockRef,
    copySelectedBlocks,
    clearSelection,
  } = useBlockSelection({ blocks });

  // 드래그 앤 드롭 관련 훅
  const {
    draggedBlockId,
    dropTarget,
    handleDragStart,
    handleDragOver,
    handleDrop,
  } = useDragAndDrop({
    blocks,
    moveBlock,
    moveBlockToParent,
    onDragComplete: loadBlocks,
  });

  // 실행 취소
  const handleUndo = useCallback(async () => {
    const success = await window.db?.undo?.();
    if (success) {
      await loadBlocks();
    } else {
      toast.error("실행 취소할 작업이 없습니다");
    }
  }, [loadBlocks]);

  // 클립보드 작업
  const handleCopy = useCallback(() => {
    const selectedBlocks = copySelectedBlocks();
    toast.success(`${selectedBlocks.length}개 블록 복사됨`);
  }, [copySelectedBlocks]);

  const handleCut = useCallback(() => {
    const selectedBlocks = copySelectedBlocks();
    deleteMultipleBlocks(Array.from(selectedBlockIds));
    toast.success(`${selectedBlocks.length}개 블록 잘라내기 완료`);
  }, [copySelectedBlocks, deleteMultipleBlocks, selectedBlockIds]);

  const handlePaste = useCallback(async () => {
    if (clipboard.length === 0 || !focusedBlockId) return;

    const focusedIndex = blocks.findIndex((b) => b.id === focusedBlockId);
    if (focusedIndex === -1) return;

    await pasteBlocks(clipboard, focusedIndex);
    toast.success(`${clipboard.length}개 블록 붙여넣기 완료`);
  }, [blocks, clipboard, focusedBlockId, pasteBlocks]);

  // 블록 복제
  const handleDuplicate = useCallback(
    async (blockId: string) => {
      await duplicateBlock(blockId);
      toast.success("블록 복제 완료");
    },
    [duplicateBlock],
  );

  // 에디터 영역 클릭 시 블록 선택 초기화
  const handleEditorClick = useCallback(
    (e: React.MouseEvent) => {
      // 블록 내부가 아닌 빈 영역 클릭 시에만 선택 초기화
      if (e.target === editorRef.current) {
        clearSelection();
      }
    },
    [clearSelection],
  );

  return (
    <div
      ref={editorRef}
      className={cn("block-editor w-full py-4", className)}
      onClick={handleEditorClick}
    >
      {/* 선택된 블록이 있을 때 표시되는 툴바 */}
      <BlockEditorToolbar
        selectedIds={selectedBlockIds}
        onCopy={handleCopy}
        onCut={handleCut}
        onDelete={() => deleteMultipleBlocks(Array.from(selectedBlockIds))}
      />

      {/* 블록 목록 */}
      <BlockList
        blocks={blocks}
        isLoading={isLoading}
        updateBlock={updateBlock}
        deleteBlock={deleteBlock}
        addBlock={addBlock}
        moveBlock={moveBlock}
        indentBlock={indentBlock}
        outdentBlock={outdentBlock}
        selectedBlockIds={selectedBlockIds}
        focusedBlockId={focusedBlockId}
        setBlockRef={setBlockRef}
        handleBlockSelect={handleBlockSelect}
        focusBlock={focusBlock}
        navigateBlocks={navigateBlocks}
        duplicateBlock={handleDuplicate}
        draggedBlockId={draggedBlockId}
        handleDragStart={handleDragStart}
        handleDragOver={handleDragOver}
        handleDrop={handleDrop}
        dropTarget={dropTarget}
        onEmptyAreaClick={handleEditorClick}
      />
    </div>
  );
}
