import React, { useState, useCallback } from "react";

interface UseBlockDragOptions {
  blockId: string;
  onDragStart?: () => void;
  onDragOver?: (position: "before" | "after" | "child") => void;
  onDrop?: () => void;
}

export function useBlockDrag({
  blockId,
  onDragStart,
  onDragOver,
  onDrop,
}: UseBlockDragOptions) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      e.stopPropagation();
      e.dataTransfer.setData("blockId", blockId);
      e.dataTransfer.effectAllowed = "move";

      // 드래그 중인 블록의 미리보기 설정
      if (e.currentTarget instanceof HTMLElement) {
        const rect = e.currentTarget.getBoundingClientRect();
        e.dataTransfer.setDragImage(e.currentTarget, rect.width / 2, 10);
      }

      setIsDragging(true);
      if (onDragStart) {
        onDragStart();
      }
    },
    [blockId, onDragStart],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, ref: React.RefObject<HTMLElement>) => {
      e.preventDefault();
      e.stopPropagation();

      if (!onDragOver || !ref.current) return;

      const rect = ref.current.getBoundingClientRect();
      const upperThird = rect.top + rect.height / 3;
      const lowerThird = rect.top + (rect.height * 2) / 3;

      if (e.clientY < upperThird) {
        // 상단 영역 - 블록 위에 삽입
        onDragOver("before");
      } else if (e.clientY > lowerThird) {
        // 하단 영역 - 블록 아래에 삽입
        onDragOver("after");
      } else {
        // 중간 영역 - 블록 내부에 삽입 (자식으로)
        onDragOver("child");
      }
    },
    [onDragOver],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      setIsDragging(false);
      if (onDrop) {
        onDrop();
      }
    },
    [onDrop],
  );

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  return {
    isDragging,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
  };
}
