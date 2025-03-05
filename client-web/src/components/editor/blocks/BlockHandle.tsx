import React from "react";
import { cn } from "@/lib/utils";
import { IconGripVertical } from "@tabler/icons-react";
import BlockMenus from "./BlockMenus";
import { BlockType } from "@/types/block";

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
}

const BlockHandle: React.FC<BlockHandleProps> = ({
  isHovered,
  isSelected,
  onMouseDown,
  onAddBlock,
  onTypeChange,
  onDuplicate,
  onIndent,
  onOutdent,
  onDelete,
  isFirstChild,
  hasParent,
}) => {
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
        {/* 드래그 핸들 */}
        <div
          className="h-5 w-5 flex items-center justify-center cursor-grab hover:bg-accent/20 rounded-sm"
          onMouseDown={onMouseDown}
        >
          <IconGripVertical className="h-3.5 w-3.5 text-muted-foreground" />
        </div>

        {/* 블록 메뉴 버튼들 */}
        <BlockMenus
          onAddBlock={onAddBlock}
          onTypeChange={onTypeChange}
          onDuplicate={onDuplicate}
          onIndent={onIndent}
          onOutdent={onOutdent}
          onDelete={onDelete}
          isFirstChild={isFirstChild}
          hasParent={hasParent}
        />
      </div>
    </div>
  );
};

export default BlockHandle;
