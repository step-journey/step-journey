import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { DND_TYPES } from "../constants/dndTypes";
import { Block } from "@/features/block/types";

interface DraggableStepGroupProps {
  id: string;
  block: Block;
  children: React.ReactNode;
  isDragOverlay?: boolean;
}

export function DraggableStepGroup({
  id,
  block,
  children,
  isDragOverlay = false,
}: DraggableStepGroupProps) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id,
    data: {
      type: DND_TYPES.DRAGGABLE_STEP_GROUP,
      block,
    },
  });

  return (
    <div
      ref={!isDragOverlay ? setNodeRef : undefined}
      {...(!isDragOverlay ? { ...listeners, ...attributes } : {})}
      className={`step-group-item ${isDragOverlay ? "drag-overlay" : ""}`}
    >
      {children}
    </div>
  );
}
