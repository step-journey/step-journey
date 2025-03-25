import { useDroppable } from "@dnd-kit/core";
import { DND_TYPES } from "../constants/dndTypes";

interface StepDropIndicatorProps {
  id: string;
  groupId: string;
  index: number;
  isOver?: boolean;
}

export function StepDropIndicator({
  id,
  groupId,
  index,
  isOver,
}: StepDropIndicatorProps) {
  const { setNodeRef } = useDroppable({
    id,
    data: {
      type: DND_TYPES.STEP_GAP,
      groupId,
      index,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`step-drop-indicator ${isOver ? "step-drop-indicator-active" : ""}`}
      style={{
        top: index === 0 ? 0 : undefined,
        bottom: index !== 0 ? 0 : undefined,
      }}
    />
  );
}
