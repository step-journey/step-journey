import React, { useRef, useEffect, useState, useCallback } from "react";
import { Block, BlockType } from "@/types/block";
import { cn } from "@/lib/utils";
import ChildBlocks from "./ChildBlocks";
import db from "@/db";
import BlockContent from "./blocks/BlockContent";
import BlockHandle from "./blocks/BlockHandle";
import { useBlockActions } from "./hooks/useBlockActions";
import { useBlockDrag } from "./hooks/useBlockDrag";
import { useCaretManager } from "@/lib/caret";

interface BlockItemProps {
  block: Block;
  updateBlock: (id: string, changes: Partial<Block>) => Promise<void>;
  deleteBlock: (id: string) => Promise<void>;
  addBlock: (blockType: BlockType, index: number) => Promise<string | null>;
  moveBlock: (blockId: string, targetIndex: number) => Promise<void>;
  indentBlock: (id: string) => Promise<void>;
  outdentBlock: (id: string) => Promise<void>;
  index: number;
  depth?: number;
  totalBlocks: number;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  setBlockRef?: (id: string, el: HTMLElement | null) => void;
  isSelected?: boolean;
  isFocused?: boolean;
  onSelect?: (id: string, multiSelect: boolean) => void;
  focusBlock?: (id: string) => void;
  onDuplicate?: () => void;
  onDragStart?: () => void;
  onDragOver?: (position: "before" | "after" | "child") => void;
  onDrop?: () => void;
  isDragged?: boolean;
  dropIndicator?: "before" | "after" | "child" | null;
  classNameExtra?: string;
}

export default function BlockItem({
  block,
  updateBlock,
  deleteBlock,
  addBlock,
  moveBlock,
  indentBlock,
  outdentBlock,
  index,
  depth = 0,
  totalBlocks,
  onArrowUp,
  onArrowDown,
  setBlockRef,
  isSelected = false,
  isFocused = false,
  onSelect,
  focusBlock,
  onDuplicate,
  onDragStart,
  onDragOver,
  onDrop,
  isDragged = false,
  dropIndicator = null,
  classNameExtra = "",
}: BlockItemProps) {
  const blockRef = useRef<HTMLDivElement>(null);
  const [hasChildren, setHasChildren] = useState(false);

  // 캐럿 관리자 초기화
  const caretManager = useCaretManager({
    editorRef: blockRef,
    blockId: block.id,
  });

  // 자식 블록 존재 여부 확인
  useEffect(() => {
    const loadChildBlocks = async () => {
      if (block.content.length > 0) {
        const children = await Promise.all(
          block.content.map((id) => db.getBlock(id)),
        );
        const validChildren = children.filter(Boolean);
        setHasChildren(validChildren.length > 0);
      } else {
        setHasChildren(false);
      }
    };

    loadChildBlocks();
  }, [block.content]);

  // ref 설정 및 포커스 처리
  useEffect(() => {
    if (setBlockRef) {
      setBlockRef(block.id, blockRef.current);
    }

    // 포커스된 블록이면 contenteditable 영역 포커스
    if (isFocused && blockRef.current) {
      const editableElement = caretManager.getEditableElement();

      if (editableElement) {
        // contenteditable 요소에 포커스
        editableElement.focus();

        // 저장된 커서 위치 정보가 있는지 확인하고 복원
        caretManager.restoreColumnAfterBlockNavigation();
      }
    }
  }, [block.id, setBlockRef, isFocused, caretManager]);

  // 블록 액션 훅
  const {
    isExpanded,
    isHovered,
    setIsHovered,
    handleContentChange,
    handleTypeChange,
    handleAddBlock,
    handleIndent,
    handleOutdent,
    handleDeleteBlock,
    handleDuplicateBlock,
    toggleExpand,
    toggleTodo,
    handleMouseDown,
  } = useBlockActions(
    block,
    index,
    totalBlocks,
    updateBlock,
    addBlock,
    indentBlock,
    outdentBlock,
    deleteBlock,
    moveBlock,
    onDuplicate,
  );

  // 드래그 앤 드롭 훅
  const {
    handleDragStart: onDragStartHandler,
    handleDragOver: onDragOverHandler,
    handleDrop: onDropHandler,
    handleDragEnd,
  } = useBlockDrag({
    blockId: block.id,
    onDragStart,
    onDragOver,
    onDrop,
  });

  // 블록 선택 처리
  const handleBlockClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelect) {
      const multiSelect = e.shiftKey || e.ctrlKey || e.metaKey;
      onSelect(block.id, multiSelect);
    }
    if (focusBlock) {
      focusBlock(block.id);
    }
  };

  // 드래그 이벤트 처리기
  const handleDragOverEvent = (e: React.DragEvent) => {
    onDragOverHandler(e, blockRef);
  };

  // 방향키 핸들러
  const handleArrowUp = () => {
    if (onArrowUp) {
      // 현재 블록의 캐럿 위치를 저장하고 이전 블록으로 이동
      if (caretManager.isAtLineStart()) {
        caretManager.saveColumnForBlockNavigation();
        onArrowUp();
      }
    }
  };

  const handleArrowDown = () => {
    if (onArrowDown) {
      // 현재 블록의 캐럿 위치를 저장하고 다음 블록으로 이동
      if (caretManager.isAtLineEnd()) {
        caretManager.saveColumnForBlockNavigation();
        onArrowDown();
      }
    }
  };

  const handleChangeColor = useCallback(
    async (color: string) => {
      // 색상 값의 종류에 따라 처리
      if (color.endsWith("-bg")) {
        // 배경색 변경
        const bgColor = color.replace("-bg", "");
        await updateBlock(block.id, {
          format: {
            ...block.format,
            backgroundColor: bgColor || null, // 빈 문자열이면 null로 설정하여 삭제
          },
        });
      } else {
        // 텍스트 색상 변경
        await updateBlock(block.id, {
          format: {
            ...block.format,
            color: color || null, // 빈 문자열이면 null로 설정하여 삭제
          },
        });
      }
    },
    [block.id, block.format, updateBlock],
  );

  return (
    <div
      ref={blockRef}
      data-block-id={block.id}
      className={cn(
        "block-item group relative",
        classNameExtra,
        isSelected && "bg-accent/20 rounded",
        isFocused && "ring-primary/40 rounded",
        isDragged && "opacity-50",
      )}
      onClick={handleBlockClick}
      draggable
      onDragStart={onDragStartHandler}
      onDragOver={handleDragOverEvent}
      onDrop={onDropHandler}
      onDragEnd={handleDragEnd}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-block-type={block.type}
    >
      {/* 드롭 표시선 */}
      {dropIndicator === "before" && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary z-10" />
      )}
      {dropIndicator === "after" && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary z-10" />
      )}
      {dropIndicator === "child" && (
        <div className="absolute inset-0 border-2 border-primary/30 rounded z-10 pointer-events-none" />
      )}

      {/* 색 표시자 (color indicator): 노션의 블록 색상 표시 기능 */}
      {block.format?.color && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l"
          style={{ backgroundColor: block.format.color }}
        />
      )}

      {/* 블록 컨텐츠 부분 */}
      <div className="flex w-full">
        {/* 왼쪽 핸들 영역 */}
        <BlockHandle
          isHovered={isHovered}
          isSelected={isSelected}
          onMouseDown={handleMouseDown}
          onAddBlock={handleAddBlock}
          onTypeChange={handleTypeChange}
          onDuplicate={handleDuplicateBlock}
          onIndent={handleIndent}
          onOutdent={handleOutdent}
          onDelete={handleDeleteBlock}
          isFirstChild={index <= 0}
          hasParent={!!block.parent}
          onChangeColor={handleChangeColor}
        />

        {/* 실제 블록 콘텐츠 */}
        <BlockContent
          block={block}
          blockType={block.type}
          isExpanded={isExpanded}
          toggleExpand={toggleExpand}
          handleContentChange={handleContentChange}
          handleAddBlock={handleAddBlock}
          handleIndent={handleIndent}
          handleOutdent={handleOutdent}
          handleDeleteBlock={index > 0 ? handleDeleteBlock : undefined}
          handleChangeType={handleTypeChange}
          toggleTodo={toggleTodo}
          onArrowUp={handleArrowUp}
          onArrowDown={handleArrowDown}
          caretManager={caretManager}
        />
      </div>

      {/* 자식 블록 */}
      {hasChildren && isExpanded && (
        <ChildBlocks
          parentId={block.id}
          addBlock={addBlock}
          updateBlock={updateBlock}
          deleteBlock={deleteBlock}
          moveBlock={moveBlock}
          indentBlock={indentBlock}
          outdentBlock={outdentBlock}
          depth={depth + 1}
        />
      )}
    </div>
  );
}
