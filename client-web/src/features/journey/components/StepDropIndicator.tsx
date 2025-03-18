import { useDroppable } from "@dnd-kit/core";

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
      type: "stepGap",
      groupId,
      index,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`step-drop-indicator ${isOver ? "step-drop-indicator-active" : ""}`}
    />
  );
}
