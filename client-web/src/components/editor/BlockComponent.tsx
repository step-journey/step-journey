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
} from "@tabler/icons-react";
import TextEditor from "./TextEditor";
import BlockTypeMenu from "./BlockTypeMenu";
import BlockChildren from "./BlockChildren";
import db from "@/db";

interface BlockComponentProps {
  block: Block;
  updateBlock: (id: string, changes: Partial<Block>) => Promise<void>;
  deleteBlock: (id: string) => Promise<void>;
  addBlock: (blockType: BlockType, index: number) => Promise<void>;
  moveBlock: (blockId: string, targetIndex: number) => Promise<void>;
  indentBlock: (id: string) => Promise<void>;
  outdentBlock: (id: string) => Promise<void>;
  index: number;
  depth?: number;
  totalBlocks: number;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  setBlockRef?: (id: string, el: HTMLElement | null) => void;
  isFocused?: boolean;
  /**
   * 자식에서 start-of-content / end-of-content 등 추가 클래스를 달기 위한 커스텀
   */
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
  isFocused,
  classNameExtra = "",
}: BlockComponentProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [hasChildren, setHasChildren] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dropIndicatorPosition, setDropIndicatorPosition] = useState<
    "top" | "bottom" | null
  >(null);

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
    setIsMenuOpen(false);
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

  // 드래그 앤 드롭
  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartY.current = e.clientY;
    dragCurrentIndex.current = index;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      if (blockRef.current) {
        const rect = blockRef.current.getBoundingClientRect();
        const blockMiddle = rect.top + rect.height / 2;

        if (e.clientY < blockMiddle) {
          setDropIndicatorPosition("top");
        } else {
          setDropIndicatorPosition("bottom");
        }

        const moveThreshold = 60;
        const moveDistance = e.clientY - dragStartY.current;

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
      setDropIndicatorPosition(null);
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
          checked: [[currentChecked ? "No" : "Yes"]],
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
        return "notion-bulleted_list-block"; // 임시로 동일 구조. 실제는 별도 구현
      default:
        return "notion-text-block"; // 기타는 우선 text block 스타일
    }
  }

  // heading 타입일 때 h1/h2/h3 구분
  function renderHeadingTag(content: string) {
    if (block.type === "heading_1") {
      return (
        <h1
          spellCheck="true"
          placeholder="제목1"
          contentEditable
          data-content-editable-leaf="true"
          style={{ fontSize: "1.875em", lineHeight: "1.3", margin: 0 }}
          className="notranslate"
        >
          {content}
        </h1>
      );
    } else if (block.type === "heading_2") {
      return (
        <h2
          spellCheck="true"
          placeholder="제목2"
          contentEditable
          data-content-editable-leaf="true"
          style={{ fontSize: "1.5em", lineHeight: "1.35", margin: 0 }}
          className="notranslate"
        >
          {content}
        </h2>
      );
    } else if (block.type === "heading_3") {
      return (
        <h3
          spellCheck="true"
          placeholder="제목3"
          contentEditable
          data-content-editable-leaf="true"
          style={{ fontSize: "1.25em", lineHeight: "1.4", margin: 0 }}
          className="notranslate"
        >
          {content}
        </h3>
      );
    }
    return null;
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

      case "heading_1":
      case "heading_2":
      case "heading_3": {
        const text = block.properties.title?.[0]?.[0] || "";
        return <>{renderHeadingTag(text) /* 실제 h1/h2/h3 */}</>;
      }

      case "bulleted_list":
      case "numbered_list": {
        // 실제 Notion의 리스트 아이템 구조를 비슷하게 흉내
        const text = block.properties.title?.[0]?.[0] || "";
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
              className="notion-list-item-box-left pseudoSelection"
              data-content-editable-void="true"
              data-text-edit-side="start"
            >
              <div className="pseudoBefore" />
            </div>
            <div
              style={{
                flex: 1,
                minWidth: 1,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ display: "flex" }}>
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
        "notion-selectable",
        notionBlockClass,
        classNameExtra,
        isDragging && "opacity-50",
      )}
      style={{ position: "relative" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-block-type={block.type}
    >
      {/* Notion 내부에서 보이는 구조: <div style="display:flex;"><div contentEditable>...</div></div> */}
      <div style={{ color: "inherit", fill: "inherit", width: "100%" }}>
        <div style={{ display: "flex", width: "100%" }}>
          {/* 드롭 표시선 */}
          {dropIndicatorPosition && (
            <div
              className={cn("block-drop-indicator")}
              style={{
                [dropIndicatorPosition === "top" ? "top" : "bottom"]: 0,
              }}
            />
          )}

          {/* 왼쪽 툴(핸들, +버튼 등) */}
          <div
            className={cn(
              "absolute -ml-10 h-full pt-1.5 flex items-start",
              "opacity-0 transition-opacity group-hover:opacity-100",
              (isHovered || isDragging) && "opacity-100",
            )}
            style={{ left: 0 }}
          >
            <div className="flex gap-1.5 items-center">
              <div
                className="h-5 w-5 flex items-center justify-center cursor-grab hover:bg-accent/20 rounded-sm"
                onMouseDown={handleDragStart}
              >
                <IconGripVertical className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-5 w-5 p-0"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <IconPlus className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
              {isMenuOpen && (
                <BlockTypeMenu
                  onSelect={handleTypeChange}
                  onClose={() => setIsMenuOpen(false)}
                />
              )}
            </div>
          </div>

          {/* 실제 블록 콘텐츠 */}
          <div className="w-full">{renderBlockContent()}</div>
        </div>
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
