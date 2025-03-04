import React from "react";
import { Button } from "@/components/ui/button";
import {
  IconPlus,
  IconDots,
  IconCopy,
  IconTrash,
  IconArrowBarDown,
  IconArrowBarUp,
} from "@tabler/icons-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { COMMON_BLOCK_TYPES } from "./BlockTypes";
import { BlockType } from "@/types/block";

interface BlockMenusProps {
  onAddBlock: () => void;
  onTypeChange: (type: BlockType) => void;
  onDuplicate: () => void;
  onIndent: () => void;
  onOutdent: () => void;
  onDelete: () => void;
  isFirstChild: boolean;
  hasParent: boolean;
}

const BlockMenus: React.FC<BlockMenusProps> = ({
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
    <>
      {/* 블록 메뉴 (기존 "+" 버튼 개선) */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" className="h-5 w-5 p-0">
            <IconPlus className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuItem onClick={onAddBlock}>새 블록 추가</DropdownMenuItem>
          <DropdownMenuSeparator />
          {COMMON_BLOCK_TYPES.map((type) => (
            <DropdownMenuItem key={type} onClick={() => onTypeChange(type)}>
              {type === "text"
                ? "텍스트로 변환"
                : `${type.replace("_", " ")}로 변환`}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 블록 작업 메뉴 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="h-5 w-5 flex items-center justify-center hover:bg-accent/20 rounded-sm">
            <IconDots className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuItem onClick={onDuplicate}>
            <IconCopy className="h-4 w-4 mr-2" />
            블록 복제
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onIndent} disabled={isFirstChild}>
            <IconArrowBarDown className="h-4 w-4 mr-2" />
            들여쓰기
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onOutdent} disabled={!hasParent}>
            <IconArrowBarUp className="h-4 w-4 mr-2" />
            내어쓰기
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive" onClick={onDelete}>
            <IconTrash className="h-4 w-4 mr-2" />
            삭제
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export default BlockMenus;
