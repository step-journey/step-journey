import React, { useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import BlocksContainer from "./BlocksContainer";
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
    duplicateBlock,
    moveBlock,
    moveBlockToParent,
    indentBlock,
    outdentBlock,
  } = useBlockOperations(pageId);

  // Load blocks when component mounts
  useEffect(() => {
    loadBlocks();
  }, [loadBlocks, pageId]);

  // 블록 선택 관련 훅
  const {
    selectedBlockIds,
    focusedBlockId,
    handleBlockSelect,
    focusBlock,
    navigateBlocks,
    setBlockRef,
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
      {/* 블록 목록 */}
      <BlocksContainer
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
