// src/components/editor/BlockComponent.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Block, BlockType } from "@/types/block";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  IconChevronDown,
  IconPlus,
  IconGripVertical,
  IconChevronRight,
  IconDots,
  IconCopy,
  IconTrash,
  IconArrowBarDown,
  IconArrowBarUp,
} from "@tabler/icons-react";
import TextEditor from "./TextEditor";
import BlockChildren from "./BlockChildren";
import db from "@/db";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BlockComponentProps {
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

export default function BlockComponent({
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
}: BlockComponentProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [hasChildren, setHasChildren] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const blockRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const dragCurrentIndex = useRef(index);

  // 자식 블록 존재 여부
  const loadChildBlocks = useCallback(async () => {
    if (block.content.length > 0) {
      const children = await Promise.all(
        block.content.map((id) => db.getBlock(id)),
      );
      const validChildren = children.filter(Boolean);
      setHasChildren(validChildren.length > 0);
    } else {
      setHasChildren(false);
    }
  }, [block.content]);

  useEffect(() => {
    loadChildBlocks();
  }, [loadChildBlocks]);

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
        (editableDiv as HTMLElement).focus();
      }
    }
  }, [block.id, setBlockRef, isFocused]);

  // 블록 내용 업데이트
  const handleContentChange = async (title: Array<[string, any[]]>) => {
    await updateBlock(block.id, {
      properties: {
        ...block.properties,
        title,
      },
    });
  };

  // 블록 타입 변경
  const handleTypeChange = async (newType: BlockType) => {
    await updateBlock(block.id, {
      type: newType,
    });
  };

  // 새 블록 추가
  const handleAddBlock = async () => {
    await addBlock("text", index);
  };

  // 들여쓰기
  const handleIndent = async () => {
    await indentBlock(block.id);
  };

  // 내어쓰기
  const handleOutdent = async () => {
    await outdentBlock(block.id);
  };

  // 블록 삭제
  const handleDeleteBlock = async () => {
    await deleteBlock(block.id);
  };

  // 블록 복제
  const handleDuplicateBlock = () => {
    if (onDuplicate) {
      onDuplicate();
    }
  };

  // 블록 선택
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

  // 드래그 앤 드롭
  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    e.dataTransfer.setData("blockId", block.id);
    e.dataTransfer.effectAllowed = "move";

    // 드래그 중인 블록의 미리보기 설정
    if (blockRef.current) {
      const rect = blockRef.current.getBoundingClientRect();
      e.dataTransfer.setDragImage(blockRef.current, rect.width / 2, 10);
    }

    setIsDragging(true);
    if (onDragStart) {
      onDragStart();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!onDragOver || !blockRef.current) return;

    const rect = blockRef.current.getBoundingClientRect();
    const upperThird = rect.top + rect.height / 3;
    const lowerThird = rect.top + (rect.height * 2) / 3;

    if (e.clientY < upperThird) {
      // 상단 영역 - 블록 위에 삽입
      onDragOver("before");
    } else if (e.clientY > lowerThird) {
      // 하단 영역 - 블록 아래에 삽입
      onDragOver("after");
    } else {
      // 중간 영역 - 블록 내부에 삽입 (자식으로)
      onDragOver("child");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(false);
    if (onDrop) {
      onDrop();
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // 마우스 드래그 (노션 스타일)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // 왼쪽 클릭만 처리

    e.preventDefault();
    setIsDragging(true);
    dragStartY.current = e.clientY;
    dragCurrentIndex.current = index;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      if (blockRef.current) {
        const moveDistance = e.clientY - dragStartY.current;
        const moveThreshold = 30; // 더 작은 드래그로 이동 가능하도록 조정

        if (Math.abs(moveDistance) > moveThreshold) {
          const newIndex =
            moveDistance > 0
              ? Math.min(dragCurrentIndex.current + 1, totalBlocks - 1)
              : Math.max(dragCurrentIndex.current - 1, 0);

          if (newIndex !== dragCurrentIndex.current) {
            moveBlock(block.id, newIndex).then(() => {
              dragCurrentIndex.current = newIndex;
              dragStartY.current = e.clientY;
            });
          }
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // 토글 확장/축소
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // to_do 블록 체크박스
  const toggleTodo = async () => {
    if (block.type === "to_do") {
      const currentChecked = block.properties.checked?.[0]?.[0] === "Yes";
      await updateBlock(block.id, {
        properties: {
          ...block.properties,
          checked: [[currentChecked ? "No" : "Yes", []]],
        },
      });
    }
  };

  // 실제 노션에서 block type 에 따라 className을 부여
  function getNotionBlockClassName(type: BlockType) {
    switch (type) {
      case "text":
        return "notion-text-block";
      case "heading_1":
        return "notion-header-block";
      case "heading_2":
        return "notion-header-block";
      case "heading_3":
        return "notion-header-block";
      case "bulleted_list":
        return "notion-bulleted_list-block notion-synthetic-group-block";
      case "numbered_list":
        return "notion-numbered_list-block notion-synthetic-group-block";
      case "to_do":
        return "notion-to_do-block";
      case "toggle":
        return "notion-toggle-block";
      case "callout":
        return "notion-callout-block";
      case "quote":
        return "notion-quote-block";
      case "divider":
        return "notion-divider-block";
      case "code":
        return "notion-code-block";
      case "image":
        return "notion-image-block";
      default:
        return "notion-text-block"; // 기타는 우선 text block 스타일
    }
  }

  // 블록별 실제 렌더링
  const renderBlockContent = () => {
    switch (block.type) {
      case "to_do":
        return (
          <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
            <input
              type="checkbox"
              checked={block.properties.checked?.[0]?.[0] === "Yes"}
              onChange={toggleTodo}
              style={{ marginRight: "8px", marginTop: "2px" }}
            />
            <div style={{ flex: 1 }}>
              <TextEditor
                value={block.properties.title || [["", []]]}
                onChange={handleContentChange}
                blockType={block.type}
                onEnter={handleAddBlock}
                onTab={handleIndent}
                onShiftTab={handleOutdent}
                onDelete={index > 0 ? handleDeleteBlock : undefined}
                onChangeType={handleTypeChange}
                onArrowUp={onArrowUp}
                onArrowDown={onArrowDown}
              />
            </div>
          </div>
        );

      case "toggle":
        return (
          <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
            <button
              className="p-0.5 hover:bg-accent/50 rounded-sm"
              onClick={toggleExpand}
              style={{ marginRight: "8px", marginTop: "2px" }}
            >
              {isExpanded ? (
                <IconChevronDown className="h-4 w-4" />
              ) : (
                <IconChevronRight className="h-4 w-4" />
              )}
            </button>
            <div style={{ flex: 1 }}>
              <TextEditor
                value={block.properties.title || [["", []]]}
                onChange={handleContentChange}
                blockType="text"
                onEnter={handleAddBlock}
                onTab={handleIndent}
                onShiftTab={handleOutdent}
                onDelete={index > 0 ? handleDeleteBlock : undefined}
                onChangeType={handleTypeChange}
                onArrowUp={onArrowUp}
                onArrowDown={onArrowDown}
              />
            </div>
          </div>
        );

      case "divider":
        return <hr className="border-t border-border my-2 w-full" />;

      case "callout":
        return (
          <div className="flex items-start gap-2 p-3 bg-accent/20 rounded-md w-full">
            <span className="text-xl">💡</span>
            <div className="flex-1">
              <TextEditor
                value={block.properties.title || [["", []]]}
                onChange={handleContentChange}
                blockType="text"
                onEnter={handleAddBlock}
                onTab={handleIndent}
                onShiftTab={handleOutdent}
                onDelete={index > 0 ? handleDeleteBlock : undefined}
                onChangeType={handleTypeChange}
                onArrowUp={onArrowUp}
                onArrowDown={onArrowDown}
              />
            </div>
          </div>
        );

      case "quote":
        return (
          <div className="border-l-4 border-border pl-4 italic">
            <TextEditor
              value={block.properties.title || [["", []]]}
              onChange={handleContentChange}
              blockType={block.type}
              onEnter={handleAddBlock}
              onTab={handleIndent}
              onShiftTab={handleOutdent}
              onDelete={index > 0 ? handleDeleteBlock : undefined}
              onChangeType={handleTypeChange}
              onArrowUp={onArrowUp}
              onArrowDown={onArrowDown}
            />
          </div>
        );

      case "code":
        return (
          <div className="font-mono bg-muted p-3 rounded overflow-x-auto">
            <TextEditor
              value={block.properties.title || [["", []]]}
              onChange={handleContentChange}
              blockType={block.type}
              onEnter={(e) => {
                // code 블록 내에서는 줄바꿈만 삽입
                const event = e as unknown as React.KeyboardEvent;
                if (!event.shiftKey) {
                  e();
                }
              }}
              onTab={handleIndent}
              onShiftTab={handleOutdent}
              onDelete={index > 0 ? handleDeleteBlock : undefined}
              onChangeType={handleTypeChange}
              onArrowUp={onArrowUp}
              onArrowDown={onArrowDown}
            />
          </div>
        );

      case "image":
        // 이미지 블록 (파일이 있을 경우 표시, 없으면 업로드 UI)
        return block.properties.source?.[0]?.[0] ? (
          <div className="w-full">
            <img
              src={block.properties.source[0][0]}
              alt={block.properties.caption?.[0]?.[0] || "Image"}
              className="max-w-full rounded-md"
            />
            <div className="text-sm text-muted-foreground mt-1">
              <TextEditor
                value={block.properties.caption || [["", []]]}
                onChange={(value) =>
                  updateBlock(block.id, {
                    properties: {
                      ...block.properties,
                      caption: value,
                    },
                  })
                }
                blockType="text"
                placeholder="이미지 설명 추가..."
                onEnter={handleAddBlock}
                onTab={handleIndent}
                onShiftTab={handleOutdent}
                onArrowUp={onArrowUp}
                onArrowDown={onArrowDown}
              />
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-border rounded-md p-8 text-center">
            <div className="text-muted-foreground mb-2">
              이미지를 여기에 드래그하거나 클릭하여 업로드
            </div>
            <Button variant="outline" size="sm">
              이미지 업로드
            </Button>
          </div>
        );

      case "heading_1":
      case "heading_2":
      case "heading_3": {
        return (
          <TextEditor
            value={block.properties.title || [["", []]]}
            onChange={handleContentChange}
            blockType={block.type}
            onEnter={handleAddBlock}
            onTab={handleIndent}
            onShiftTab={handleOutdent}
            onDelete={index > 0 ? handleDeleteBlock : undefined}
            onChangeType={handleTypeChange}
            onArrowUp={onArrowUp}
            onArrowDown={onArrowDown}
          />
        );
      }

      case "bulleted_list":
      case "numbered_list": {
        return (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              width: "100%",
              paddingLeft: "2px",
            }}
          >
            <div
              contentEditable={false}
              className="notion-list-item-bullet flex-shrink-0 mr-2 mt-1.5"
            >
              {block.type === "bulleted_list" ? (
                <div className="bullet-disc">•</div>
              ) : (
                <div className="number-bullet">{index + 1}.</div>
              )}
            </div>
            <div className="flex-grow">
              <TextEditor
                value={block.properties.title || [["", []]]}
                onChange={handleContentChange}
                blockType={block.type}
                onEnter={handleAddBlock}
                onTab={handleIndent}
                onShiftTab={handleOutdent}
                onDelete={index > 0 ? handleDeleteBlock : undefined}
                onChangeType={handleTypeChange}
                onArrowUp={onArrowUp}
                onArrowDown={onArrowDown}
              />
            </div>
          </div>
        );
      }

      default:
        // 일반 텍스트 등
        return (
          <TextEditor
            value={block.properties.title || [["", []]]}
            onChange={handleContentChange}
            blockType={block.type}
            onEnter={handleAddBlock}
            onTab={handleIndent}
            onShiftTab={handleOutdent}
            onDelete={index > 0 ? handleDeleteBlock : undefined}
            onChangeType={handleTypeChange}
            onArrowUp={onArrowUp}
            onArrowDown={onArrowDown}
          />
        );
    }
  };

  const notionBlockClass = getNotionBlockClassName(block.type);

  return (
    <div
      ref={blockRef}
      data-block-id={block.id}
      className={cn(
        "notion-selectable group relative",
        notionBlockClass,
        classNameExtra,
        isSelected && "bg-accent/20 rounded",
        isFocused && "ring-1 ring-primary/40 rounded",
        isDragged && "opacity-50",
      )}
      onClick={handleBlockClick}
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
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
        <div
          className={cn(
            "absolute -ml-10 h-full pt-1.5 flex items-start",
            "opacity-0 transition-opacity group-hover:opacity-100",
            (isHovered || isSelected) && "opacity-100",
          )}
          style={{ left: 0 }}
        >
          <div className="flex gap-1.5 items-center">
            {/* 드래그 핸들 */}
            <div
              className="h-5 w-5 flex items-center justify-center cursor-grab hover:bg-accent/20 rounded-sm"
              onMouseDown={handleMouseDown}
            >
              <IconGripVertical className="h-3.5 w-3.5 text-muted-foreground" />
            </div>

            {/* 블록 메뉴 (기존 "+" 버튼 개선) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="h-5 w-5 p-0">
                  <IconPlus className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem onClick={handleAddBlock}>
                  새 블록 추가
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleTypeChange("text")}>
                  텍스트로 변환
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleTypeChange("heading_1")}>
                  제목 1로 변환
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleTypeChange("heading_2")}>
                  제목 2로 변환
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleTypeChange("heading_3")}>
                  제목 3로 변환
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleTypeChange("bulleted_list")}
                >
                  글머리 기호 목록으로 변환
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleTypeChange("numbered_list")}
                >
                  번호 매기기 목록으로 변환
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleTypeChange("to_do")}>
                  할 일 목록으로 변환
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleTypeChange("callout")}>
                  콜아웃으로 변환
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleTypeChange("quote")}>
                  인용구로 변환
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleTypeChange("code")}>
                  코드로 변환
                </DropdownMenuItem>
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
                <DropdownMenuItem onClick={handleDuplicateBlock}>
                  <IconCopy className="h-4 w-4 mr-2" />
                  블록 복제
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleIndent} disabled={index <= 0}>
                  <IconArrowBarDown className="h-4 w-4 mr-2" />
                  들여쓰기
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleOutdent}
                  disabled={!block.parent}
                >
                  <IconArrowBarUp className="h-4 w-4 mr-2" />
                  내어쓰기
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={handleDeleteBlock}
                >
                  <IconTrash className="h-4 w-4 mr-2" />
                  삭제
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* 실제 블록 콘텐츠 */}
        <div className="w-full">{renderBlockContent()}</div>
      </div>

      {/* 자식 블록 */}
      {hasChildren && isExpanded && (
        <BlockChildren
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
