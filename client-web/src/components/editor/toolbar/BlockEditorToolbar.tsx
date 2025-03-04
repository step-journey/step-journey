import React from "react";
import { IconCopy, IconCut, IconTrash } from "@tabler/icons-react";

interface BlockEditorToolbarProps {
  selectedIds: Set<string>;
  onCopy: () => void;
  onCut: () => void;
  onDelete: () => void;
}

/**
 * 에디터 상단에 표시되는 툴바 컴포넌트
 */
const BlockEditorToolbar: React.FC<BlockEditorToolbarProps> = ({
  selectedIds,
  onCopy,
  onCut,
  onDelete,
}) => {
  if (selectedIds.size === 0) return null;

  return (
    <div className="fixed top-16 left-1/2 transform -translate-x-1/2 bg-background border border-border rounded-md shadow-md flex items-center gap-2 p-1 z-50">
      <button
        className="p-1.5 rounded hover:bg-accent/50"
        onClick={onCopy}
        title="복사 (Ctrl+C)"
      >
        <IconCopy className="h-4 w-4" />
      </button>
      <button
        className="p-1.5 rounded hover:bg-accent/50"
        onClick={onCut}
        title="잘라내기 (Ctrl+X)"
      >
        <IconCut className="h-4 w-4" />
      </button>
      <div className="w-px h-4 bg-border mx-1"></div>
      <button
        className="p-1.5 rounded hover:bg-accent/50 text-destructive"
        onClick={onDelete}
        title="삭제 (Delete)"
      >
        <IconTrash className="h-4 w-4" />
      </button>
    </div>
  );
};

export default BlockEditorToolbar;
