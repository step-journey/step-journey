// src/components/editor/BlockEditor.tsx
import { useState, useCallback, useEffect, useRef } from "react";
import { Block, BlockType, createTextBlock } from "@/types/block";
import BlockComponent from "./BlockComponent";
import db from "@/db";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { useHotkeys } from "react-hotkeys-hook";
import { IconCopy, IconCut, IconTrash } from "@tabler/icons-react";

interface BlockEditorProps {
  pageId: string;
  className?: string;
}

export default function BlockEditor({ pageId, className }: BlockEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBlockIds, setSelectedBlockIds] = useState<Set<string>>(
    new Set(),
  );
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const [clipboard, setClipboard] = useState<Block[]>([]);
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{
    id: string;
    position: "before" | "after" | "child";
  } | null>(null);
  const blockRefs = useRef<{ [key: string]: HTMLElement | null }>({});
  const editorRef = useRef<HTMLDivElement>(null);

  // 페이지의 모든 블록 로드
  const loadBlocks = useCallback(async () => {
    try {
      setIsLoading(true);
      const pageBlocks = await db.getBlocksWithParent(pageId);

      // 페이지가 비어있으면 빈 텍스트 블록 추가
      if (pageBlocks.length === 0) {
        const newBlock = createTextBlock(pageId);
        await db.createBlock(newBlock);
        await db.addBlockToParent(newBlock.id, pageId);
        setBlocks([newBlock]);
        setFocusedBlockId(newBlock.id);
      } else {
        // 블록 순서 정렬
        const page = await db.getBlock(pageId);
        if (page) {
          const orderedBlocks = page.content
            .map((id) => pageBlocks.find((b) => b.id === id))
            .filter(Boolean) as Block[];
          setBlocks(orderedBlocks);
        } else {
          setBlocks(pageBlocks);
        }
      }
    } catch (error) {
      console.error("Failed to load blocks:", error);
      toast.error("블록을 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [pageId]);

  useEffect(() => {
    loadBlocks();
  }, [loadBlocks]);

  // 블록 추가
  const addBlock = async (
    blockType: BlockType = "text",
    index: number,
  ): Promise<string | null> => {
    try {
      // 새 블록 생성
      const newBlock = createTextBlock(pageId);

      // 타입이 text가 아니면 타입 업데이트
      if (blockType !== "text") {
        newBlock.type = blockType as any; // 타입 문제 임시 해결
      }

      // 블록 저장
      await db.createBlock(newBlock);

      // 페이지의 content 배열에 새 블록 ID 추가
      const page = await db.getBlock(pageId);
      if (page) {
        const newContent = [...page.content];
        newContent.splice(index + 1, 0, newBlock.id);
        await db.updateBlock(pageId, { content: newContent });

        // 로컬 상태 업데이트
        const newBlocks = [...blocks];
        newBlocks.splice(index + 1, 0, newBlock);
        setBlocks(newBlocks);

        // 새 블록으로 포커스 이동
        setFocusedBlockId(newBlock.id);
        focusBlock(newBlock.id);
      }

      return newBlock.id;
    } catch (error) {
      console.error("Failed to add block:", error);
      toast.error("블록 추가 실패");
      return null;
    }
  };

  // 블록 업데이트
  const updateBlock = async (id: string, changes: Partial<Block>) => {
    try {
      await db.updateBlock(id, changes);

      // 로컬 상태 업데이트
      setBlocks((prev) =>
        prev.map((block) =>
          block.id === id ? { ...block, ...changes } : block,
        ),
      );
    } catch (error) {
      console.error("Failed to update block:", error);
      toast.error("블록 업데이트 실패");
    }
  };

  // 블록 삭제
  const deleteBlock = async (id: string) => {
    try {
      await db.deleteBlock(id);

      // 페이지의 content 배열에서 해당 블록 ID 제거
      const page = await db.getBlock(pageId);
      if (page) {
        const newContent = page.content.filter((blockId) => blockId !== id);
        await db.updateBlock(pageId, { content: newContent });

        // 로컬 상태 업데이트
        const blockIndex = blocks.findIndex((b) => b.id === id);
        const newBlocks = blocks.filter((block) => block.id !== id);
        setBlocks(newBlocks);

        // 다음/이전 블록으로 포커스 이동
        if (newBlocks.length > 0) {
          const nextBlockIndex = Math.min(blockIndex, newBlocks.length - 1);
          setFocusedBlockId(newBlocks[nextBlockIndex].id);
          focusBlock(newBlocks[nextBlockIndex].id);
        } else {
          // 페이지가 비어있으면 새 블록 추가
          addBlock("text", -1);
        }
      }
    } catch (error) {
      console.error("Failed to delete block:", error);
      toast.error("블록 삭제 실패");
    }
  };

  // 다중 블록 삭제
  const deleteSelectedBlocks = async () => {
    if (selectedBlockIds.size === 0) return;

    try {
      // 부모 블록을 제거하면 자식 블록도 함께 삭제되므로
      // 선택된 블록 중 최상위 블록만 필터링
      const topLevelBlockIds = Array.from(selectedBlockIds).filter((id) => {
        const block = blocks.find((b) => b.id === id);
        return !block || !block.parent || !selectedBlockIds.has(block.parent);
      });

      for (const blockId of topLevelBlockIds) {
        await deleteBlock(blockId);
      }

      // 선택 상태 초기화
      setSelectedBlockIds(new Set());

      // 블록 목록 새로고침
      loadBlocks();
      toast.success("선택된 블록이 삭제되었습니다");
    } catch (error) {
      console.error("Failed to delete blocks:", error);
      toast.error("블록 삭제 실패");
    }
  };

  // 블록 이동 (같은 부모 내에서)
  const moveBlock = async (blockId: string, targetIndex: number) => {
    try {
      await db.moveBlockInParent(blockId, targetIndex);

      // 로컬 상태 업데이트
      const currentIndex = blocks.findIndex((b) => b.id === blockId);
      if (currentIndex === -1) return;

      const newBlocks = [...blocks];
      const [movedBlock] = newBlocks.splice(currentIndex, 1);
      newBlocks.splice(targetIndex, 0, movedBlock);

      setBlocks(newBlocks);
    } catch (error) {
      console.error("Failed to move block:", error);
      toast.error("블록 이동 실패");
    }
  };

  // 블록 중첩 (들여쓰기)
  const indentBlock = async (id: string) => {
    try {
      await db.indentBlock(id);
      loadBlocks(); // 전체 블록 구조가 변경되므로 새로고침
    } catch (error) {
      console.error("Failed to indent block:", error);
      toast.error("블록 들여쓰기 실패");
    }
  };

  // 블록 중첩 해제 (내어쓰기)
  const outdentBlock = async (id: string) => {
    try {
      await db.outdentBlock(id);
      loadBlocks(); // 전체 블록 구조가 변경되므로 새로고침
    } catch (error) {
      console.error("Failed to outdent block:", error);
      toast.error("블록 내어쓰기 실패");
    }
  };

  // 블록 포커스 처리
  const focusBlock = (blockId: string) => {
    setFocusedBlockId(blockId);

    // DOM이 업데이트된 후 포커스 적용
    setTimeout(() => {
      if (blockRefs.current[blockId]) {
        const editableDiv = blockRefs.current[blockId]?.querySelector(
          '[contenteditable="true"]',
        );

        if (editableDiv) {
          (editableDiv as HTMLElement).focus();

          // 커서를 마지막 위치로 이동
          const textContent = editableDiv.textContent || "";
          const selection = window.getSelection();
          if (selection) {
            const range = document.createRange();
            if (editableDiv.firstChild) {
              range.setStart(editableDiv.firstChild, textContent.length);
              range.setEnd(editableDiv.firstChild, textContent.length);
            } else {
              range.setStart(editableDiv, 0);
              range.setEnd(editableDiv, 0);
            }
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }
      }
    }, 10);
  };

  // 방향키로 블록 이동
  const navigateBlocks = (direction: "up" | "down") => {
    if (!focusedBlockId) return;

    const currentIndex = blocks.findIndex((b) => b.id === focusedBlockId);
    if (currentIndex === -1) return;

    if (direction === "up" && currentIndex > 0) {
      focusBlock(blocks[currentIndex - 1].id);
    } else if (direction === "down" && currentIndex < blocks.length - 1) {
      focusBlock(blocks[currentIndex + 1].id);
    }
  };

  // 블록 선택 처리
  const handleBlockSelect = (blockId: string, multiSelect: boolean) => {
    if (multiSelect) {
      // 다중 선택 (Ctrl/Cmd + 클릭)
      setSelectedBlockIds((prev) => {
        const newSelection = new Set(prev);
        if (newSelection.has(blockId)) {
          newSelection.delete(blockId);
        } else {
          newSelection.add(blockId);
        }
        return newSelection;
      });
    } else {
      // 단일 선택
      setSelectedBlockIds(new Set([blockId]));
    }

    setFocusedBlockId(blockId);
  };

  // 블록 복사
  const copySelectedBlocks = async () => {
    if (selectedBlockIds.size === 0) return;

    try {
      const selectedBlocks = blocks.filter((block) =>
        selectedBlockIds.has(block.id),
      );
      setClipboard(selectedBlocks);
      toast.success(`${selectedBlocks.length}개 블록 복사됨`);
    } catch (error) {
      console.error("Failed to copy blocks:", error);
      toast.error("블록 복사 실패");
    }
  };

  // 블록 붙여넣기
  const pasteBlocks = async () => {
    if (clipboard.length === 0 || !focusedBlockId) return;

    try {
      const focusedIndex = blocks.findIndex((b) => b.id === focusedBlockId);
      if (focusedIndex === -1) return;

      // 새로운 블록 ID 생성 및 상대적 위치 유지하며 복제
      for (let i = 0; i < clipboard.length; i++) {
        const originalBlock = clipboard[i];

        // 블록 복제 (타입, 속성 등 유지)
        const newBlock = {
          ...originalBlock,
          id: uuidv4(),
          parent: pageId,
          content: [], // 자식 블록은 별도로 처리
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // 블록 생성
        await db.createBlock(newBlock);

        // 페이지의 content 배열에 새 블록 추가
        const page = await db.getBlock(pageId);
        if (page) {
          const newContent = [...page.content];
          newContent.splice(focusedIndex + 1 + i, 0, newBlock.id);
          await db.updateBlock(pageId, { content: newContent });
        }
      }

      // 블록 목록 새로고침
      loadBlocks();
      toast.success(`${clipboard.length}개 블록 붙여넣기 완료`);
    } catch (error) {
      console.error("Failed to paste blocks:", error);
      toast.error("블록 붙여넣기 실패");
    }
  };

  // 블록 복제
  const duplicateBlock = async (blockId: string) => {
    try {
      await db.duplicateBlock(blockId, true);
      loadBlocks();
      toast.success("블록 복제 완료");
    } catch (error) {
      console.error("Failed to duplicate block:", error);
      toast.error("블록 복제 실패");
    }
  };

  // 블록 참조 설정
  const setBlockRef = (id: string, el: HTMLElement | null) => {
    blockRefs.current[id] = el;
  };

  // 실행 취소
  const handleUndo = async () => {
    const success = await db.undo();
    if (success) {
      loadBlocks();
    } else {
      toast.error("실행 취소할 작업이 없습니다");
    }
  };

  // 단축키 설정
  useHotkeys("mod+z", (e: any) => {
    e.preventDefault();
    handleUndo();
  });

  useHotkeys("mod+c", (e: any) => {
    if (selectedBlockIds.size > 0) {
      e.preventDefault();
      copySelectedBlocks();
    }
  });

  useHotkeys("mod+v", (e: any) => {
    if (clipboard.length > 0 && focusedBlockId) {
      e.preventDefault();
      pasteBlocks();
    }
  });

  useHotkeys("mod+d", (e: any) => {
    if (focusedBlockId) {
      e.preventDefault();
      duplicateBlock(focusedBlockId);
    }
  });

  useHotkeys("delete, backspace", (e: any) => {
    // 블록 내부 편집이 아닌 경우에만 실행
    const selection = window.getSelection();
    if (selection && selection.toString() === "" && selectedBlockIds.size > 0) {
      e.preventDefault();
      deleteSelectedBlocks();
    }
  });

  // 드래그 앤 드롭 핸들러
  const handleDragStart = (blockId: string) => {
    setDraggedBlockId(blockId);
  };

  const handleDragOver = (
    blockId: string,
    position: "before" | "after" | "child",
  ) => {
    if (draggedBlockId && draggedBlockId !== blockId) {
      setDropTarget({ id: blockId, position });
    }
  };

  const handleDrop = async () => {
    if (!draggedBlockId || !dropTarget) return;

    try {
      const sourceBlock = blocks.find((b) => b.id === draggedBlockId);
      const targetBlock = blocks.find((b) => b.id === dropTarget.id);
      if (!sourceBlock || !targetBlock) return;

      const targetIndex = blocks.findIndex((b) => b.id === dropTarget.id);

      // 드롭 위치에 따른 처리
      if (dropTarget.position === "child") {
        // 타겟 블록의 자식으로 이동
        await db.moveBlock(draggedBlockId, targetBlock.id);
      } else if (dropTarget.position === "before") {
        // 타겟 블록 앞으로 이동
        await moveBlock(draggedBlockId, targetIndex);
      } else {
        // 타겟 블록 뒤로 이동
        await moveBlock(draggedBlockId, targetIndex + 1);
      }

      // UI 상태 초기화 및 블록 새로고침
      setDraggedBlockId(null);
      setDropTarget(null);
      loadBlocks();
    } catch (error) {
      console.error("Failed to move block:", error);
      toast.error("블록 이동 실패");
    }
  };

  // 에디터 영역 클릭 시 블록 선택 초기화
  const handleEditorClick = (e: React.MouseEvent) => {
    // 블록 내부가 아닌 빈 영역 클릭 시에만 선택 초기화
    if (e.target === editorRef.current) {
      setSelectedBlockIds(new Set());
    }
  };

  return (
    <div
      ref={editorRef}
      className={cn("block-editor w-full py-4", className)}
      onClick={handleEditorClick}
    >
      {/* 선택된 블록이 있을 때 표시되는 툴바 */}
      {selectedBlockIds.size > 0 && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 bg-background border border-border rounded-md shadow-md flex items-center gap-2 p-1 z-50">
          <button
            className="p-1.5 rounded hover:bg-accent/50"
            onClick={copySelectedBlocks}
            title="복사 (Ctrl+C)"
          >
            <IconCopy className="h-4 w-4" />
          </button>
          <button
            className="p-1.5 rounded hover:bg-accent/50"
            onClick={() => {
              copySelectedBlocks();
              deleteSelectedBlocks();
            }}
            title="잘라내기 (Ctrl+X)"
          >
            <IconCut className="h-4 w-4" />
          </button>
          <div className="w-px h-4 bg-border mx-1"></div>
          <button
            className="p-1.5 rounded hover:bg-accent/50 text-destructive"
            onClick={deleteSelectedBlocks}
            title="삭제 (Delete)"
          >
            <IconTrash className="h-4 w-4" />
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mr-2"></div>
          <span className="text-muted-foreground">Loading editor...</span>
        </div>
      ) : (
        blocks.map((block, index) => (
          <BlockComponent
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
            onSelect={(id, multi) => handleBlockSelect(id, multi)}
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
          />
        ))
      )}

      {blocks.length === 0 && !isLoading && (
        <div
          className="p-2 text-muted-foreground cursor-text"
          onClick={() => addBlock("text", -1)}
        >
          Type '/' for commands...
        </div>
      )}
    </div>
  );
}
