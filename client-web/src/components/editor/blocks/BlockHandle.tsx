import React from "react";
import { cn } from "@/lib/utils";
import { IconGripVertical, IconPlus } from "@tabler/icons-react";
import { BlockType } from "@/types/block";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import BlockContextMenu from "@/components/editor/BlockContextMenu";

interface BlockHandleProps {
  isHovered: boolean;
  isSelected: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onAddBlock: () => void;
  onTypeChange: (type: BlockType) => void;
  onDuplicate: () => void;
  onIndent: () => void;
  onOutdent: () => void;
  onDelete: () => void;
  isFirstChild: boolean;
  hasParent: boolean;
  onChangeColor?: (color: string) => void;
}

/**
 * BlockHandle - Left-side gutter area for block controls
 *
 * This component renders the left gutter area that appears when hovering over a block.
 * It contains:
 * 1. A grip icon that works as both a drag handle and a menu trigger
 * 2. A "+" button for quickly adding a new block
 *
 * When the grip icon is clicked, it shows a context menu with "Turn into" and "Color" options.
 *
 * @param {BlockHandleProps} props - The component props
 * @returns {JSX.Element} The rendered block gutter
 */
const BlockHandle: React.FC<BlockHandleProps> = ({
  isHovered,
  isSelected,
  onMouseDown,
  onAddBlock,
  onTypeChange,
  onChangeColor,
}) => {
  // 드래그 시작 여부를 추적하기 위한 변수
  const dragStarted = React.useRef(false);
  const mouseDownPos = React.useRef({ x: 0, y: 0 });

  // 드래그 이벤트와 클릭 이벤트를 구분하는 핸들러
  const handleMouseDown = (e: React.MouseEvent) => {
    dragStarted.current = false;
    mouseDownPos.current = { x: e.clientX, y: e.clientY };

    // 문서 레벨에서 마우스 움직임 감지
    const handleMouseMove = (moveEvent: MouseEvent) => {
      // 일정 거리 이상 움직였을 때 드래그로 인식
      const dx = moveEvent.clientX - mouseDownPos.current.x;
      const dy = moveEvent.clientY - mouseDownPos.current.y;
      if (Math.sqrt(dx * dx + dy * dy) > 5) {
        dragStarted.current = true;
      }
    };

    const handleMouseUp = () => {
      // 이벤트 리스너 정리
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);

      // 드래그가 시작되었다면 onMouseDown 콜백 실행
      if (dragStarted.current) {
        onMouseDown(e);
      }
      // 드래그가 시작되지 않았다면 클릭 이벤트로 처리됨 (DropdownMenu에서 처리)
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div
      className={cn(
        "block-handle absolute -ml-10 h-full pt-1.5 flex items-start",
        "opacity-0 transition-opacity group-hover:opacity-100",
        (isHovered || isSelected) && "opacity-100",
      )}
      style={{ left: 0 }}
    >
      <div className="flex gap-1.5 items-center">
        {/* ⋮⋮ 버튼: 드래그 핸들 겸 컨텍스트 메뉴 트리거 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div
              className="block-drag-handle h-5 w-5 flex items-center justify-center cursor-grab hover:bg-accent/20 rounded-sm"
              onMouseDown={handleMouseDown}
            >
              <IconGripVertical className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </DropdownMenuTrigger>
          <BlockContextMenu
            onTurnInto={onTypeChange}
            onChangeColor={onChangeColor}
          />
        </DropdownMenu>

        {/* + 버튼: 바로 새 블록 추가 */}
        <button
          className="block-add-button h-5 w-5 flex items-center justify-center hover:bg-accent/20 rounded-sm"
          onClick={onAddBlock}
        >
          <IconPlus className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
};

export default BlockHandle;
