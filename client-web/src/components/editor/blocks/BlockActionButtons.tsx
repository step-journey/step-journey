import React from "react";
import { Button } from "@/components/ui/button";
import { IconPlus, IconDots } from "@tabler/icons-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BlockType } from "@/types/block";
import BlockContextMenu from "@/components/editor/BlockContextMenu";

interface BlockActionButtonsProps {
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
 * BlockActionButtons - Quick action buttons that appear in the block gutter
 *
 * This component renders two action buttons in the left gutter area of a block:
 * 1. "+" button: For directly adding a new empty block below the current one
 * 2. "⋯" (dots) button: Opens a context menu with Turn into and Color options
 *
 * The behavior matches Notion's interface where + immediately adds a new block
 * and the dots menu shows minimal context actions.
 *
 * @param {BlockActionButtonsProps} props - The component props
 * @returns {JSX.Element} The rendered action buttons
 */
const BlockActionButtons: React.FC<BlockActionButtonsProps> = ({
  onAddBlock,
  onTypeChange,
  onChangeColor,
}) => {
  return (
    <div className="block-action-buttons flex gap-1.5">
      {/* + 버튼: 바로 새 블록 추가 */}
      <Button
        size="icon"
        variant="ghost"
        className="h-5 w-5 p-0"
        onClick={onAddBlock} // 직접 onAddBlock 실행
      >
        <IconPlus className="h-3.5 w-3.5 text-muted-foreground" />
      </Button>

      {/* ⋯ 버튼: Notion 스타일 컨텍스트 메뉴 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="h-5 w-5 flex items-center justify-center hover:bg-accent/20 rounded-sm">
            <IconDots className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </DropdownMenuTrigger>
        <BlockContextMenu
          onTurnInto={onTypeChange}
          onChangeColor={onChangeColor}
        />
      </DropdownMenu>
    </div>
  );
};

export default BlockActionButtons;
