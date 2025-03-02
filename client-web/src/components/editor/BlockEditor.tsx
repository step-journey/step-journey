import { useState, useCallback, useEffect, useRef } from "react";
import { createTextBlock, Block, BlockType } from "@/types/block";
import BlockComponent from "./BlockComponent";
import db from "@/db";
import { cn } from "@/lib/utils";

interface BlockEditorProps {
  pageId: string;
  className?: string;
}

export default function BlockEditor({ pageId, className }: BlockEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [focusedBlockIndex, setFocusedBlockIndex] = useState<number | null>(
    null,
  );
  const blockRefs = useRef<{ [key: string]: HTMLElement | null }>({});

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
    } finally {
      setIsLoading(false);
    }
  }, [pageId]);

  useEffect(() => {
    loadBlocks();
  }, [loadBlocks]);

  // 블록 추가
  const addBlock = async (blockType: BlockType = "text", index: number) => {
    // 먼저 기본 텍스트 블록 생성
    const newBlock = createTextBlock(pageId);

    // 먼저 블록 생성
    await db.createBlock(newBlock);

    // 타입이 text가 아니면 타입 업데이트
    if (blockType !== "text") {
      await db.updateBlock(newBlock.id, { type: blockType });

      // 클라이언트 상태용 블록 객체 생성
      const clientBlock = {
        ...newBlock,
        type: blockType,
      } as Block;

      // 페이지의 content 배열에 새 블록 ID 추가
      const page = await db.getBlock(pageId);
      if (page) {
        const newContent = [...page.content];
        newContent.splice(index + 1, 0, newBlock.id);
        await db.updateBlock(pageId, { content: newContent });

        // 로컬 상태 업데이트
        const newBlocks = [...blocks];
        newBlocks.splice(index + 1, 0, clientBlock);
        setBlocks(newBlocks);

        // 새 블록으로 포커스 이동
        setFocusedBlockIndex(index + 1);
      }
    } else {
      // 타입이 text인 경우 그대로 진행
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
        setFocusedBlockIndex(index + 1);
      }
    }

    // 블록 생성 후 약간 지연을 두고 포커스 처리
    setTimeout(() => {
      focusBlock(index + 1);
    }, 10);
  };

  // 블록 업데이트
  const updateBlock = async (id: string, changes: Partial<Block>) => {
    await db.updateBlock(id, changes);

    // 로컬 상태 업데이트
    setBlocks(
      blocks.map((block) =>
        block.id === id ? { ...block, ...changes } : block,
      ),
    );
  };

  // 블록 삭제
  const deleteBlock = async (id: string) => {
    await db.deleteBlock(id);

    // 페이지의 content 배열에서 해당 블록 ID 제거
    const page = await db.getBlock(pageId);
    if (page) {
      const newContent = page.content.filter((blockId) => blockId !== id);
      await db.updateBlock(pageId, { content: newContent });

      // 로컬 상태 업데이트
      setBlocks(blocks.filter((block) => block.id !== id));

      // 페이지에 블록이 없으면 새 블록 추가
      if (newContent.length === 0) {
        addBlock("text", -1);
      }
    }
  };

  // 블록 이동 (드래그 앤 드롭용 개선 버전)
  const moveBlock = async (blockId: string, targetIndex: number) => {
    const currentIndex = blocks.findIndex((b) => b.id === blockId);
    if (currentIndex === -1 || currentIndex === targetIndex) return;

    // 페이지의 content 배열에서 블록 위치 변경
    const page = await db.getBlock(pageId);
    if (page) {
      const newContent = [...page.content];
      // Remove from current position
      const [movedBlock] = newContent.splice(currentIndex, 1);
      // Insert at new position
      newContent.splice(targetIndex, 0, movedBlock);

      await db.updateBlock(pageId, { content: newContent });

      // 로컬 상태 업데이트
      const newBlocks = [...blocks];
      const [movedBlockObj] = newBlocks.splice(currentIndex, 1);
      newBlocks.splice(targetIndex, 0, movedBlockObj);
      setBlocks(newBlocks);
    }
  };

  // 블록 중첩 (들여쓰기)
  const indentBlock = async (id: string) => {
    const blockIndex = blocks.findIndex((b) => b.id === id);
    if (blockIndex <= 0) return; // 첫번째 블록은 들여쓰기 불가

    const prevBlock = blocks[blockIndex - 1];

    // 현재 페이지의 content에서 해당 블록 제거
    const page = await db.getBlock(pageId);
    if (page) {
      const newPageContent = page.content.filter((blockId) => blockId !== id);
      await db.updateBlock(pageId, { content: newPageContent });

      // 이전 블록의 content에 현재 블록 추가
      const newPrevContent = [...prevBlock.content, id];
      await db.updateBlock(prevBlock.id, { content: newPrevContent });

      // 현재 블록의 parent 업데이트
      await db.updateBlock(id, { parent: prevBlock.id });

      // 로컬 상태 업데이트
      loadBlocks();
    }
  };

  // 블록 중첩 해제 (내어쓰기)
  const outdentBlock = async (id: string) => {
    const block = blocks.find((b) => b.id === id);
    if (!block || !block.parent || block.parent === pageId) return;

    // 부모 블록 찾기
    const parentBlock = await db.getBlock(block.parent);
    if (!parentBlock || !parentBlock.parent) return;

    const grandParentId = parentBlock.parent;

    // 부모 블록의 content에서 현재 블록 제거
    const newParentContent = parentBlock.content.filter(
      (blockId) => blockId !== id,
    );
    await db.updateBlock(parentBlock.id, { content: newParentContent });

    // 부모의 부모(조부모)의 content에 현재 블록 추가
    const grandParent = await db.getBlock(grandParentId);
    if (grandParent) {
      const parentIndex = grandParent.content.indexOf(parentBlock.id);
      const newGrandParentContent = [...grandParent.content];
      newGrandParentContent.splice(parentIndex + 1, 0, id);
      await db.updateBlock(grandParentId, { content: newGrandParentContent });

      // 현재 블록의 parent 업데이트
      await db.updateBlock(id, { parent: grandParentId });

      // 로컬 상태 업데이트
      loadBlocks();
    }
  };

  // 블록 포커스 처리
  const focusBlock = (index: number) => {
    if (index >= 0 && index < blocks.length) {
      setFocusedBlockIndex(index);
      const blockId = blocks[index].id;

      setTimeout(() => {
        // DOM이 업데이트된 후 포커스 적용
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
      }, 0);
    }
  };

  // 블록 위 이동
  const handleMoveUp = (currentIndex: number) => {
    if (currentIndex > 0) {
      focusBlock(currentIndex - 1);
    }
  };

  // 블록 아래 이동
  const handleMoveDown = (currentIndex: number) => {
    if (currentIndex < blocks.length - 1) {
      focusBlock(currentIndex + 1);
    }
  };

  // 블록 참조 설정
  const setBlockRef = (id: string, el: HTMLElement | null) => {
    blockRefs.current[id] = el;
  };

  if (isLoading) {
    return <div className="p-4 text-muted-foreground">Loading editor...</div>;
  }

  return (
    <div className={cn("block-editor w-full py-4", className)}>
      {blocks.map((block, index) => (
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
          onArrowUp={() => handleMoveUp(index)}
          onArrowDown={() => handleMoveDown(index)}
          setBlockRef={setBlockRef}
          isFocused={focusedBlockIndex === index}
        />
      ))}
      {blocks.length === 0 && (
        <div
          className="p-2 text-muted-foreground cursor-text"
          onClick={() => addBlock("text", -1)}
        >
          Click to add content...
        </div>
      )}
    </div>
  );
}
