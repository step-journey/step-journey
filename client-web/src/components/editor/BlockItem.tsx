import React, { useRef, useEffect, useState, useCallback } from "react";
import { Block, BlockType } from "@/types/block";
import { cn } from "@/lib/utils";
import ChildBlocks from "./ChildBlocks";
import db from "@/db";
import BlockContent from "./blocks/BlockContent";
import BlockHandle from "./blocks/BlockHandle";
import { useBlockActions } from "./hooks/useBlockActions";
import { useBlockDrag } from "./hooks/useBlockDrag";
import { getNotionBlockClassName } from "./blocks/BlockTypes";

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
      const editableDiv = blockRef.current.querySelector(
        '[contenteditable="true"]',
      );
      if (editableDiv) {
        // 저장된 커서 위치 정보가 있는지 확인
        const savedColumn = localStorage.getItem("caretColumn");

        // contenteditable 요소에 포커스
        (editableDiv as HTMLElement).focus();

        // 저장된 커서 위치가 있으면 해당 위치로 커서 이동
        if (savedColumn) {
          const column = parseInt(savedColumn, 10);
          const text = (editableDiv as HTMLElement).textContent || "";

          // 텍스트 내용과 커서 위치를 고려하여 적절한 위치 계산
          const firstLineEnd = text.indexOf("\n");
          const lineLength = firstLineEnd === -1 ? text.length : firstLineEnd;
          const targetPosition = Math.min(column, lineLength);

          // 캐럿 위치 설정
          try {
            const selection = window.getSelection();
            if (selection) {
              const range = document.createRange();
              const textNode =
                (editableDiv as HTMLElement).firstChild || editableDiv;
              range.setStart(textNode, targetPosition);
              range.collapse(true);
              selection.removeAllRanges();
              selection.addRange(range);
            }
          } catch (e) {
            console.error("Error setting caret position:", e);
          }

          // 사용 후 삭제
          localStorage.removeItem("caretColumn");
        }
      }
    }
  }, [block.id, setBlockRef, isFocused]);

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
      // 현재 블록의 contenteditable 요소에서 커서 위치를 저장
      const editableDiv = blockRef.current?.querySelector(
        '[contenteditable="true"]',
      );
      if (editableDiv) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          // 첫 번째 줄에서의 커서 위치 계산
          const text = editableDiv.textContent || "";
          const firstLineEnd = text.indexOf("\n");
          const cursorPos = range.startOffset;

          // 커서가 첫 번째 줄에 있는 경우
          if (firstLineEnd === -1 || cursorPos <= firstLineEnd) {
            // 현재 줄에서의 열(column) 위치 저장
            localStorage.setItem("caretColumn", cursorPos.toString());
            onArrowUp();
          }
        }
      }
    }
  };

  const handleArrowDown = () => {
    if (onArrowDown) {
      // 현재 블록의 contenteditable 요소에서 커서 위치를 저장
      const editableDiv = blockRef.current?.querySelector(
        '[contenteditable="true"]',
      );
      if (editableDiv) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const text = editableDiv.textContent || "";
          const cursorPos = range.startOffset;

          // 마지막 줄에서의 커서 위치 계산
          const lastNewlinePos = text.lastIndexOf("\n");
          const columnPos =
            lastNewlinePos === -1
              ? cursorPos // 단일 줄인 경우
              : cursorPos - lastNewlinePos - 1; // 여러 줄인 경우

          // 마지막 줄에 있는 경우
          if (lastNewlinePos === -1 || cursorPos > lastNewlinePos) {
            // 현재 줄에서의 열(column) 위치 저장
            localStorage.setItem("caretColumn", columnPos.toString());
            onArrowDown();
          }
        }
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

  const notionBlockClass = getNotionBlockClassName(block.type);

  return (
    <div
      ref={blockRef}
      data-block-id={block.id}
      className={cn(
        "block-item notion-selectable group relative",
        notionBlockClass,
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
