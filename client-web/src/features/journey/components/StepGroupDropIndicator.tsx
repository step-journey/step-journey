import { useDroppable } from "@dnd-kit/core";
import { DND_TYPES } from "../constants/dndTypes";

interface StepGroupDropIndicatorProps {
  id: string;
  index: number;
  isOver?: boolean;
  isEditMode?: boolean;
}

export function StepGroupDropIndicator({
  id,
  index,
  isOver,
  isEditMode,
}: StepGroupDropIndicatorProps) {
  const { setNodeRef } = useDroppable({
    id,
    data: {
      type: DND_TYPES.STEP_GROUP_GAP,
      index,
    },
    disabled: !isEditMode, // 편집 모드가 아닐 경우 드롭 비활성화
  });

  // 편집 모드가 아닌 경우 표시하지 않음
  if (!isEditMode) return null;

  return (
    <div
      ref={setNodeRef}
      className={`step-group-drop-indicator ${isOver ? "step-group-drop-indicator-active" : ""}`}
      style={{
        top: index === 0 ? 0 : undefined,
        bottom: index !== 0 ? 0 : undefined,
      }}
    />
  );
}
