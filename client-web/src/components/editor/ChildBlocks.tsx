import { useState, useEffect, useCallback } from "react";
import { Block, BlockType } from "@/types/block";
import BlockItem from "./BlockItem";
import db from "@/db";
import { cn } from "@/lib/utils";

interface ChildBlocksProps {
  parentId: string;
  addBlock: (blockType: BlockType, index: number) => Promise<string | null>;
  updateBlock: (id: string, changes: Partial<Block>) => Promise<void>;
  deleteBlock: (id: string) => Promise<void>;
  moveBlock: (id: string, targetIndex: number) => Promise<void>;
  indentBlock: (id: string) => Promise<void>;
  outdentBlock: (id: string) => Promise<void>;
  depth: number;
}

export default function ChildBlocks({
  parentId,
  addBlock,
  updateBlock,
  deleteBlock,
  indentBlock,
  outdentBlock,
  depth,
}: ChildBlocksProps) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);

  // 자식 블록 로드
  const loadBlocks = useCallback(async () => {
    try {
      setIsLoading(true);
      const parent = await db.getBlock(parentId);
      if (!parent) return;

      const childBlockIds = parent.content;
      if (childBlockIds.length === 0) {
        setBlocks([]);
        return;
      }

      const childBlocks = await Promise.all(
        childBlockIds.map((id) => db.getBlock(id)),
      );

      // 부모 블록의 content 순서대로 정렬
      const orderedBlocks: Block[] = [];
      for (const id of childBlockIds) {
        const block = childBlocks.find((b) => b && b.id === id);
        if (block) orderedBlocks.push(block);
      }

      setBlocks(orderedBlocks.filter(Boolean) as Block[]);
    } catch (error) {
      console.error("Failed to load child blocks:", error);
    } finally {
      setIsLoading(false);
    }
  }, [parentId]);

  useEffect(() => {
    loadBlocks();
  }, [loadBlocks]);

  // 차일드 블록 추가
  const handleAddChildBlock = async (
    blockType: BlockType,
    index: number,
  ): Promise<string | null> => {
    try {
      // 새 블록 생성
      const newBlockId = await addBlock(blockType, index);

      // 블록 목록 새로고침
      await loadBlocks();

      // 새 블록 포커스
      if (newBlockId !== null) {
        setFocusedBlockId(newBlockId);
      }

      // 반환 값 추가
      return newBlockId;
    } catch (error) {
      console.error("Failed to add child block:", error);
      return null;
    }
  };

  // 차일드 블록 업데이트
  const handleUpdateChildBlock = async (
    id: string,
    changes: Partial<Block>,
  ) => {
    try {
      await updateBlock(id, changes);

      // 로컬 상태 업데이트 (성능 최적화)
      setBlocks((prev) =>
        prev.map((block) =>
          block.id === id ? { ...block, ...changes } : block,
        ),
      );
    } catch (error) {
      console.error("Failed to update child block:", error);
    }
  };

  // 차일드 블록 삭제
  const handleDeleteChildBlock = async (id: string) => {
    try {
      await deleteBlock(id);

      // 부모 블록의 content 배열에서 삭제된 블록 ID 제거
      const parent = await db.getBlock(parentId);
      if (parent) {
        const newContent = parent.content.filter((blockId) => blockId !== id);
        await updateBlock(parentId, { content: newContent });
      }

      // 블록 목록 새로고침
      await loadBlocks();

      // 삭제된 블록이 선택/포커스 상태였다면 상태 초기화
      if (selectedBlockId === id) setSelectedBlockId(null);
      if (focusedBlockId === id) setFocusedBlockId(null);
    } catch (error) {
      console.error("Failed to delete child block:", error);
    }
  };

  // 블록 포커스 처리
  const handleFocusBlock = (id: string) => {
    setFocusedBlockId(id);
  };

  // 블록 선택 처리
  const handleSelectBlock = (id: string, multiSelect: boolean) => {
    if (multiSelect) {
      // 다중 선택 시 상위 컴포넌트에 위임하는 것이 좋음
      // 이 예제에서는 단순 구현
      setSelectedBlockId(id === selectedBlockId ? null : id);
    } else {
      setSelectedBlockId(id);
    }

    setFocusedBlockId(id);
  };

  // 블록 이동
  const handleMoveChildBlock = async (id: string, targetIndex: number) => {
    try {
      // 현재 인덱스 찾기
      const currentIndex = blocks.findIndex((block) => block.id === id);
      if (currentIndex === -1 || currentIndex === targetIndex) return;

      // 부모 블록 가져오기
      const parent = await db.getBlock(parentId);
      if (!parent) return;

      // 부모의 content 배열에서 블록 순서 변경
      const newContent = [...parent.content];
      // 현재 위치에서 제거하고
      newContent.splice(currentIndex, 1);
      // 타겟 위치에 추가
      newContent.splice(targetIndex, 0, id);

      // 부모 블록 업데이트
      await updateBlock(parentId, { content: newContent });

      // 블록 목록 새로고침
      await loadBlocks();
    } catch (error) {
      console.error("Failed to move child block:", error);
    }
  };

  // 들여쓰기/내어쓰기 후 블록 트리 구조 변경 시 새로고침
  const handleIndentOutdent = async (id: string, isIndent: boolean) => {
    try {
      if (isIndent) {
        await indentBlock(id);
      } else {
        await outdentBlock(id);
      }

      // 전체 블록 목록 새로고침
      await loadBlocks();
    } catch (error) {
      console.error(
        `Failed to ${isIndent ? "indent" : "outdent"} block:`,
        error,
      );
    }
  };

  return (
    <div className={cn("child-blocks ml-6 pl-2 border-l border-border/30")}>
      {isLoading ? (
        <div className="py-2 px-1 text-sm text-muted-foreground">
          로딩 중...
        </div>
      ) : blocks.length === 0 ? (
        <div className="py-2 px-1 text-sm text-muted-foreground italic">
          비어있음
        </div>
      ) : (
        blocks.map((block, index) => {
          const isFirst = index === 0;
          const isLast = index === blocks.length - 1;

          return (
            <BlockItem
              key={block.id}
              block={block}
              updateBlock={handleUpdateChildBlock}
              deleteBlock={handleDeleteChildBlock}
              addBlock={handleAddChildBlock}
              moveBlock={handleMoveChildBlock}
              indentBlock={(id) => handleIndentOutdent(id, true)}
              outdentBlock={(id) => handleIndentOutdent(id, false)}
              index={index}
              depth={depth}
              totalBlocks={blocks.length}
              isSelected={selectedBlockId === block.id}
              isFocused={focusedBlockId === block.id}
              onSelect={handleSelectBlock}
              focusBlock={handleFocusBlock}
              classNameExtra={[
                isFirst ? "start-of-content" : "",
                isLast ? "end-of-content" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            />
          );
        })
      )}
    </div>
  );
}
