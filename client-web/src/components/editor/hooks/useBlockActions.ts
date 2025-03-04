import React, { useState, useRef, useCallback } from "react";
import { Block, BlockType } from "@/types/block";

export function useBlockActions(
  block: Block,
  index: number,
  totalBlocks: number,
  updateBlock: (id: string, changes: Partial<Block>) => Promise<void>,
  addBlock: (blockType: BlockType, index: number) => Promise<string | null>,
  indentBlock: (id: string) => Promise<void>,
  outdentBlock: (id: string) => Promise<void>,
  deleteBlock: (id: string) => Promise<void>,
  moveBlock: (blockId: string, targetIndex: number) => Promise<void>,
  onDuplicate?: () => void,
) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragCurrentIndex = useRef(index);

  // 블록 내용 업데이트
  const handleContentChange = useCallback(
    async (title: Array<[string, any[]]>) => {
      await updateBlock(block.id, {
        properties: {
          ...block.properties,
          title,
        },
      });
    },
    [block.id, block.properties, updateBlock],
  );

  // 블록 타입 변경
  const handleTypeChange = useCallback(
    async (newType: BlockType) => {
      await updateBlock(block.id, {
        type: newType,
      });
    },
    [block.id, updateBlock],
  );

  // 새 블록 추가
  const handleAddBlock = useCallback(async () => {
    await addBlock("text", index);
  }, [addBlock, index]);

  // 들여쓰기
  const handleIndent = useCallback(async () => {
    await indentBlock(block.id);
  }, [block.id, indentBlock]);

  // 내어쓰기
  const handleOutdent = useCallback(async () => {
    await outdentBlock(block.id);
  }, [block.id, outdentBlock]);

  // 블록 삭제
  const handleDeleteBlock = useCallback(async () => {
    await deleteBlock(block.id);
  }, [block.id, deleteBlock]);

  // 블록 복제
  const handleDuplicateBlock = useCallback(() => {
    if (onDuplicate) {
      onDuplicate();
    }
  }, [onDuplicate]);

  // 토글 확장/축소
  const toggleExpand = useCallback(() => {
    setIsExpanded(!isExpanded);
  }, [isExpanded]);

  // to_do 블록 체크박스
  const toggleTodo = useCallback(async () => {
    if (block.type === "to_do") {
      const currentChecked = block.properties.checked?.[0]?.[0] === "Yes";
      await updateBlock(block.id, {
        properties: {
          ...block.properties,
          checked: [[currentChecked ? "No" : "Yes", []]],
        },
      });
    }
  }, [block.id, block.properties, block.type, updateBlock]);

  // 마우스 드래그 (노션 스타일)
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return; // 왼쪽 클릭만 처리

      e.preventDefault();
      setIsDragging(true);
      dragStartY.current = e.clientY;
      dragCurrentIndex.current = index;

      const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;

        const moveDistance = e.clientY - dragStartY.current;
        const moveThreshold = 30; // 더 작은 드래그로 이동 가능하도록 조정

        if (Math.abs(moveDistance) > moveThreshold) {
          const newIndex =
            moveDistance > 0
              ? Math.min(dragCurrentIndex.current + 1, totalBlocks - 1)
              : Math.max(dragCurrentIndex.current - 1, 0);

          if (newIndex !== dragCurrentIndex.current) {
            moveBlock(block.id, newIndex).then(() => {
              dragCurrentIndex.current = newIndex;
              dragStartY.current = e.clientY;
            });
          }
        }
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [block.id, index, isDragging, moveBlock, totalBlocks],
  );

  return {
    isExpanded,
    setIsExpanded,
    isHovered,
    setIsHovered,
    isDragging,
    setIsDragging,
    handleContentChange,
    handleTypeChange,
    handleAddBlock,
    handleIndent,
    handleOutdent,
    handleDeleteBlock,
    handleDuplicateBlock,
    toggleExpand,
    toggleTodo,
    handleMouseDown,
  };
}
