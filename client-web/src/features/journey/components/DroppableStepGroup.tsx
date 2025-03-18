import React from "react";
import { useDroppable } from "@dnd-kit/core";

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
      type: "stepGroup",
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
