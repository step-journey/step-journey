import { useCallback, useState } from "react";
import { Block, BlockType, createTextBlock } from "@/types/block";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import db from "@/db";

/**
 * 블록 CRUD 작업을 위한 훅
 */
export function useBlockOperations(pageId: string) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 모든 블록 로드
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
      toast.error("블록을 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [pageId]);

  // 블록 추가
  const addBlock = useCallback(
    async (
      blockType: BlockType = "text",
      index: number,
    ): Promise<string | null> => {
      try {
        // 새 블록 생성
        const newBlock = createTextBlock(pageId);

        // 타입이 text가 아니면 타입 업데이트
        if (blockType !== "text") {
          // Type assertion to fix the error
          (newBlock as Block).type = blockType;
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
          setBlocks((prev) => {
            const newBlocks = [...prev];
            newBlocks.splice(index + 1, 0, newBlock);
            return newBlocks;
          });
        }

        return newBlock.id;
      } catch (error) {
        console.error("Failed to add block:", error);
        toast.error("블록 추가 실패");
        return null;
      }
    },
    [pageId],
  );

  // 블록 업데이트
  const updateBlock = useCallback(
    async (id: string, changes: Partial<Block>) => {
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
    },
    [],
  );

  // 블록 삭제
  const deleteBlock = useCallback(
    async (id: string) => {
      try {
        await db.deleteBlock(id);

        // 페이지의 content 배열에서 해당 블록 ID 제거
        const page = await db.getBlock(pageId);
        if (page) {
          const newContent = page.content.filter((blockId) => blockId !== id);
          await db.updateBlock(pageId, { content: newContent });

          // 로컬 상태 업데이트
          setBlocks((prev) => prev.filter((block) => block.id !== id));
        }
      } catch (error) {
        console.error("Failed to delete block:", error);
        toast.error("블록 삭제 실패");
      }
    },
    [pageId],
  );

  // 복수 블록 삭제
  const deleteMultipleBlocks = useCallback(
    async (ids: string[]) => {
      try {
        // 최상위 블록만 필터링 (부모가 이미 삭제 대상이면 중복 삭제 방지)
        const topLevelIds = ids.filter((id) => {
          const block = blocks.find((b) => b.id === id);
          return !block?.parent || !ids.includes(block.parent);
        });

        for (const id of topLevelIds) {
          await deleteBlock(id);
        }
      } catch (error) {
        console.error("Failed to delete multiple blocks:", error);
        toast.error("블록 삭제 실패");
      }
    },
    [blocks, deleteBlock],
  );

  // 블록 복제
  const duplicateBlock = useCallback(
    async (id: string) => {
      try {
        await db.duplicateBlock(id, true);
        await loadBlocks();
      } catch (error) {
        console.error("Failed to duplicate block:", error);
        toast.error("블록 복제 실패");
      }
    },
    [loadBlocks],
  );

  // 블록 이동
  const moveBlock = useCallback(
    async (blockId: string, targetIndex: number) => {
      try {
        await db.moveBlockInParent(blockId, targetIndex);

        // 로컬 상태 업데이트
        setBlocks((prev) => {
          const currentIndex = prev.findIndex((b) => b.id === blockId);
          if (currentIndex === -1) return prev;

          const newBlocks = [...prev];
          const [movedBlock] = newBlocks.splice(currentIndex, 1);
          newBlocks.splice(targetIndex, 0, movedBlock);
          return newBlocks;
        });
      } catch (error) {
        console.error("Failed to move block:", error);
        toast.error("블록 이동 실패");
      }
    },
    [],
  );

  // 블록을 다른 블록의 자식으로 이동
  const moveBlockToParent = useCallback(
    async (blockId: string, targetParentId: string) => {
      try {
        await db.moveBlock(blockId, targetParentId);
        await loadBlocks();
      } catch (error) {
        console.error("Failed to move block to parent:", error);
        toast.error("블록 이동 실패");
      }
    },
    [loadBlocks],
  );

  // 블록 들여쓰기
  const indentBlock = useCallback(
    async (id: string) => {
      try {
        await db.indentBlock(id);
        await loadBlocks();
      } catch (error) {
        console.error("Failed to indent block:", error);
        toast.error("블록 들여쓰기 실패");
      }
    },
    [loadBlocks],
  );

  // 블록 내어쓰기
  const outdentBlock = useCallback(
    async (id: string) => {
      try {
        await db.outdentBlock(id);
        await loadBlocks();
      } catch (error) {
        console.error("Failed to outdent block:", error);
        toast.error("블록 내어쓰기 실패");
      }
    },
    [loadBlocks],
  );

  // 블록 붙여넣기
  const pasteBlocks = useCallback(
    async (clipboardBlocks: Block[], targetIndex: number) => {
      try {
        // 새로운 블록 ID 생성 및 상대적 위치 유지하며 복제
        for (let i = 0; i < clipboardBlocks.length; i++) {
          const originalBlock = clipboardBlocks[i];

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
            newContent.splice(targetIndex + 1 + i, 0, newBlock.id);
            await db.updateBlock(pageId, { content: newContent });
          }
        }

        // 블록 목록 새로고침
        await loadBlocks();
      } catch (error) {
        console.error("Failed to paste blocks:", error);
        toast.error("블록 붙여넣기 실패");
      }
    },
    [loadBlocks, pageId],
  );

  return {
    blocks,
    isLoading,
    loadBlocks,
    addBlock,
    updateBlock,
    deleteBlock,
    deleteMultipleBlocks,
    duplicateBlock,
    moveBlock,
    moveBlockToParent,
    indentBlock,
    outdentBlock,
    pasteBlocks,
  };
}
