import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { BlockRenderer } from "@/features/block/renderers";
import { Block } from "@/features/block/types";
import { DND_TYPES } from "@/features/journey/constants/dndTypes";
import { RenderingArea } from "@/features/block/constants/renderingAreaConstants";

interface DraggableStepProps {
  id: string;
  block: Block;
  isDragOverlay?: boolean;
  isEditMode?: boolean;
}

export function DraggableStep({
  id,
  block,
  isDragOverlay = false,
  isEditMode,
}: DraggableStepProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
    data: {
      type: DND_TYPES.STEP,
      block,
    },
    disabled: !isEditMode, // 편집 모드가 아닐 경우 드래그 비활성화
  });

  // 드래그 오버레이를 위한 스타일 조건부 적용 - 애니메이션 제거
  const style =
    transform && isDragOverlay
      ? {
          transform: CSS.Translate.toString(transform),
          zIndex: 1000,
          width: "calc(100% - 10px)",
          boxShadow: "0 5px 10px rgba(0,0,0,0.15)",
        }
      : undefined;

  // 커서 스타일을 편집 모드에 따라 변경
  const cursorClass = isEditMode ? "cursor-grab" : "cursor-default";

  // isDragOverlay가 true면 드래그 오버레이에 적용될 스타일 및 속성만 적용
  return (
    <div
      ref={!isDragOverlay ? setNodeRef : undefined}
      style={style}
      {...(!isDragOverlay && isEditMode ? { ...listeners, ...attributes } : {})}
      className={`step-item ${isDragOverlay ? "drag-overlay" : ""} ${cursorClass}`}
    >
      <BlockRenderer block={block} area={RenderingArea.SIDEBAR} />
    </div>
  );
}
