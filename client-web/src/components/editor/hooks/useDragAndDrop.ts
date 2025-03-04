import { useState, useCallback } from "react";
import { Block } from "@/types/block";

interface UseDragAndDropOptions {
  blocks: Block[];
  moveBlock: (blockId: string, targetIndex: number) => Promise<void>;
  moveBlockToParent: (blockId: string, parentId: string) => Promise<void>;
  onDragComplete?: () => Promise<void>;
}

/**
 * 블록 드래그 앤 드롭 관리를 위한 훅
 */
export function useDragAndDrop({
  blocks,
  moveBlock,
  moveBlockToParent,
  onDragComplete,
}: UseDragAndDropOptions) {
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{
    id: string;
    position: "before" | "after" | "child";
  } | null>(null);

  // 드래그 시작
  const handleDragStart = useCallback((blockId: string) => {
    setDraggedBlockId(blockId);
  }, []);

  // 드래그 영역 진입 시
  const handleDragOver = useCallback(
    (blockId: string, position: "before" | "after" | "child") => {
      if (draggedBlockId && draggedBlockId !== blockId) {
        setDropTarget({ id: blockId, position });
      }
    },
    [draggedBlockId],
  );

  // 드롭 처리
  const handleDrop = useCallback(async () => {
    if (!draggedBlockId || !dropTarget) return;

    try {
      const sourceBlock = blocks.find((b) => b.id === draggedBlockId);
      const targetBlock = blocks.find((b) => b.id === dropTarget.id);

      if (!sourceBlock || !targetBlock) return;

      const targetIndex = blocks.findIndex((b) => b.id === dropTarget.id);

      // 드롭 위치에 따른 처리
      if (dropTarget.position === "child") {
        // 타겟 블록의 자식으로 이동
        await moveBlockToParent(draggedBlockId, targetBlock.id);
      } else if (dropTarget.position === "before") {
        // 타겟 블록 앞으로 이동
        await moveBlock(draggedBlockId, targetIndex);
      } else {
        // 타겟 블록 뒤로 이동
        await moveBlock(draggedBlockId, targetIndex + 1);
      }

      // 완료 후 상태 초기화 및 콜백 실행
      setDraggedBlockId(null);
      setDropTarget(null);

      if (onDragComplete) {
        await onDragComplete();
      }
    } catch (error) {
      console.error("Failed to move block:", error);
      // 오류 시 상태 초기화
      setDraggedBlockId(null);
      setDropTarget(null);
    }
  }, [
    blocks,
    draggedBlockId,
    dropTarget,
    moveBlock,
    moveBlockToParent,
    onDragComplete,
  ]);

  // 드래그 취소
  const cancelDrag = useCallback(() => {
    setDraggedBlockId(null);
    setDropTarget(null);
  }, []);

  return {
    draggedBlockId,
    dropTarget,
    handleDragStart,
    handleDragOver,
    handleDrop,
    cancelDrag,
  };
}
