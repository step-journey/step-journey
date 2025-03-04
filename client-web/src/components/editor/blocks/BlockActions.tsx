import React from "react";
import { IconCopy, IconCut, IconTrash } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

interface BlockActionsProps {
  selectedCount: number;
  onCopy: () => void;
  onCut: () => void;
  onDelete: () => void;
}

/**
 * 선택된 블록에 대한 작업 툴바를 렌더링하는 컴포넌트
 */
const BlockActions: React.FC<BlockActionsProps> = ({
  selectedCount,
  onCopy,
  onCut,
  onDelete,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed top-16 left-1/2 transform -translate-x-1/2 bg-background border border-border rounded-md shadow-md flex items-center gap-2 p-1 z-50">
      <Button
        variant="ghost"
        size="sm"
        className="p-1.5 rounded hover:bg-accent/50"
        onClick={onCopy}
        title="복사 (Ctrl+C)"
      >
        <IconCopy className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="p-1.5 rounded hover:bg-accent/50"
        onClick={onCut}
        title="잘라내기 (Ctrl+X)"
      >
        <IconCut className="h-4 w-4" />
      </Button>
      <div className="w-px h-4 bg-border mx-1"></div>
      <Button
        variant="ghost"
        size="sm"
        className="p-1.5 rounded hover:bg-accent/50 text-destructive"
        onClick={onDelete}
        title="삭제 (Delete)"
      >
        <IconTrash className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default BlockActions;
