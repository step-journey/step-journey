import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { DND_TYPES } from "../constants/dndTypes";
import { Block } from "@/features/block/types";

interface DraggableStepGroupProps {
  id: string;
  block: Block;
  children: React.ReactNode;
  isDragOverlay?: boolean;
  isEditMode?: boolean;
}

export function DraggableStepGroup({
  id,
  block,
  children,
  isDragOverlay = false,
  isEditMode,
}: DraggableStepGroupProps) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id,
    data: {
      type: DND_TYPES.DRAGGABLE_STEP_GROUP,
      block,
    },
    disabled: !isEditMode, // 편집 모드가 아닐 경우 드래그 비활성화
  });

  // 커서 스타일을 편집 모드에 따라 변경
  const cursorClass = isEditMode ? "cursor-grab" : "cursor-default";

  return (
    <div
      ref={!isDragOverlay ? setNodeRef : undefined}
      {...(!isDragOverlay && isEditMode ? { ...listeners, ...attributes } : {})}
      className={`step-group-item ${isDragOverlay ? "drag-overlay" : ""} ${cursorClass}`}
    >
      {children}
    </div>
  );
}
