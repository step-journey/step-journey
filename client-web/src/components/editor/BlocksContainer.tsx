import React from "react";
import { Block, BlockType } from "@/types/block";
import BlockItem from "./BlockItem";
import { cn } from "@/lib/utils";
import { EditorState } from "@/lib/editor";

interface BlocksContainerProps {
  blocks: Block[];
  isLoading: boolean;
  updateBlock: (id: string, changes: Partial<Block>) => Promise<void>;
  deleteBlock: (id: string) => Promise<void>;
  addBlock: (blockType: BlockType, index: number) => Promise<string | null>;
  moveBlock: (blockId: string, targetIndex: number) => Promise<void>;
  indentBlock: (id: string) => Promise<void>;
  outdentBlock: (id: string) => Promise<void>;
  selectedBlockIds: Set<string>;
  focusedBlockId: string | null;
  setBlockRef: (id: string, el: HTMLElement | null) => void;
  handleBlockSelect: (id: string, multiSelect: boolean) => void;
  focusBlock: (id: string) => void;
  navigateBlocks: (direction: "up" | "down") => void;
  duplicateBlock: (id: string) => Promise<void>;
  draggedBlockId: string | null;
  handleDragStart: (blockId: string) => void;
  handleDragOver: (
    blockId: string,
    position: "before" | "after" | "child",
  ) => void;
  handleDrop: () => Promise<void>;
  dropTarget: { id: string; position: "before" | "after" | "child" } | null;
  onEmptyAreaClick: (e: React.MouseEvent) => void;
  className?: string;
  editorState?: EditorState | null;
  editorController?: any | null;
}

/**
 * 블록 목록을 렌더링하는 컴포넌트
 */
const BlocksContainer: React.FC<BlocksContainerProps> = ({
  blocks,
  isLoading,
  updateBlock,
  deleteBlock,
  addBlock,
  moveBlock,
  indentBlock,
  outdentBlock,
  selectedBlockIds,
  focusedBlockId,
  setBlockRef,
  handleBlockSelect,
  focusBlock,
  navigateBlocks,
  duplicateBlock,
  draggedBlockId,
  handleDragStart,
  handleDragOver,
  handleDrop,
  dropTarget,
  onEmptyAreaClick,
  className,
  editorState,
  editorController,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mr-2"></div>
        <span className="text-muted-foreground">Loading editor...</span>
      </div>
    );
  }

  if (blocks.length === 0) {
    return (
      <div
        className="p-2 text-muted-foreground cursor-text"
        onClick={() => addBlock("text", -1)}
      >
        Type '/' for commands...
      </div>
    );
  }

  return (
    <div
      onClick={onEmptyAreaClick}
      className={cn("blocks-container", className)}
    >
      {blocks.map((block, index) => (
        <BlockItem
          key={block.id}
          block={block}
          updateBlock={updateBlock}
          deleteBlock={deleteBlock}
          addBlock={addBlock}
          moveBlock={moveBlock}
          indentBlock={indentBlock}
          outdentBlock={outdentBlock}
          index={index}
          totalBlocks={blocks.length}
          isSelected={selectedBlockIds.has(block.id)}
          isFocused={focusedBlockId === block.id}
          setBlockRef={setBlockRef}
          onSelect={handleBlockSelect}
          focusBlock={focusBlock}
          onArrowUp={() => navigateBlocks("up")}
          onArrowDown={() => navigateBlocks("down")}
          onDuplicate={() => duplicateBlock(block.id)}
          onDragStart={() => handleDragStart(block.id)}
          onDragOver={(position) => handleDragOver(block.id, position)}
          onDrop={handleDrop}
          isDragged={draggedBlockId === block.id}
          dropIndicator={
            dropTarget?.id === block.id ? dropTarget.position : null
          }
          editorState={editorState}
          editorController={editorController}
        />
      ))}
    </div>
  );
};

export default BlocksContainer;
