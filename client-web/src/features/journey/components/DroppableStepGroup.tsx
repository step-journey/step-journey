import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { DND_TYPES } from "../constants/dndTypes";

interface DroppableStepGroupProps {
  id: string;
  children: React.ReactNode;
  isOver?: boolean;
}

export function DroppableStepGroup({
  id,
  children,
  isOver,
}: DroppableStepGroupProps) {
  const { setNodeRef } = useDroppable({
    id,
    data: {
      type: DND_TYPES.STEP_GROUP,
      groupId: id,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`step-group-droppable ${isOver ? "step-group-drop-active" : ""}`}
    >
      {children}
    </div>
  );
}
