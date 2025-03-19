import { useDroppable } from "@dnd-kit/core";
import { DND_TYPES } from "../constants/dndTypes";

interface StepGroupDropIndicatorProps {
  id: string;
  index: number;
  isOver?: boolean;
}

export function StepGroupDropIndicator({
  id,
  index,
  isOver,
}: StepGroupDropIndicatorProps) {
  const { setNodeRef } = useDroppable({
    id,
    data: {
      type: DND_TYPES.STEP_GROUP_GAP,
      index,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`step-group-drop-indicator ${isOver ? "step-group-drop-indicator-active" : ""}`}
    />
  );
}
