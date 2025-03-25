import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { DND_TYPES } from "../constants/dndTypes";

interface DroppableStepGroupProps {
  id: string;
  children: React.ReactNode;
  isOver?: boolean;
  isEditMode?: boolean;
}

export function DroppableStepGroup({
  id,
  children,
  isOver,
  isEditMode,
}: DroppableStepGroupProps) {
  const { setNodeRef } = useDroppable({
    id,
    data: {
      type: DND_TYPES.STEP_GROUP,
      groupId: id,
    },
    disabled: !isEditMode, // 편집 모드가 아닐 경우 드롭 비활성화
  });

  return (
    <div
      ref={isEditMode ? setNodeRef : undefined}
      className={`step-group-droppable ${isOver && isEditMode ? "step-group-drop-active" : ""}`}
    >
      {children}
    </div>
  );
}
