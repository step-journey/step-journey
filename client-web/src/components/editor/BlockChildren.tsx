// src/components/editor/BlockChildren.tsx
import { useState, useEffect, useCallback } from "react";
import { Block, BlockType } from "@/types/block";
import BlockComponent from "./BlockComponent";
import db from "@/db";

interface BlockChildrenProps {
  parentId: string;
  addBlock: (blockType: BlockType, index: number) => Promise<void>;
  updateBlock: (id: string, changes: Partial<Block>) => Promise<void>;
  deleteBlock: (id: string) => Promise<void>;
  moveBlock: (id: string, targetIndex: number) => Promise<void>;
  indentBlock: (id: string) => Promise<void>;
  outdentBlock: (id: string) => Promise<void>;
  depth: number;
}

export default function BlockChildren({
  parentId,
  addBlock,
  updateBlock,
  deleteBlock,
  moveBlock,
  indentBlock,
  outdentBlock,
  depth,
}: BlockChildrenProps) {
  const [blocks, setBlocks] = useState<Block[]>([]);

  // 자식 블록 로드
  const loadBlocks = useCallback(async () => {
    try {
      const parent = await db.getBlock(parentId);
      if (!parent) return;

      const childBlocks = await Promise.all(
        parent.content.map((id) => db.getBlock(id)),
      );

      setBlocks(childBlocks.filter(Boolean) as Block[]);
    } catch (error) {
      console.error("Failed to load child blocks:", error);
    }
  }, [parentId]);

  useEffect(() => {
    loadBlocks();
  }, [loadBlocks]);

  // 차일드 블록 추가
  const handleAddChildBlock = async (blockType: BlockType, index: number) => {
    await addBlock(blockType, index);
    loadBlocks();
  };

  // 차일드 블록 업데이트
  const handleUpdateChildBlock = async (
    id: string,
    changes: Partial<Block>,
  ) => {
    await updateBlock(id, changes);
    loadBlocks();
  };

  // 차일드 블록 삭제
  const handleDeleteChildBlock = async (id: string) => {
    await deleteBlock(id);
    loadBlocks();
  };

  // 차일드 블록 이동
  const handleMoveChildBlock = async (id: string, targetIndex: number) => {
    await moveBlock(id, targetIndex);
    loadBlocks();
  };

  return (
    <div className="ml-6 pl-2 border-l border-border/30">
      {blocks.map((block, index) => {
        const isFirst = index === 0;
        const isLast = index === blocks.length - 1;

        return (
          <BlockComponent
            key={block.id}
            block={block}
            updateBlock={handleUpdateChildBlock}
            deleteBlock={handleDeleteChildBlock}
            addBlock={handleAddChildBlock}
            moveBlock={handleMoveChildBlock}
            indentBlock={indentBlock}
            outdentBlock={outdentBlock}
            index={index}
            depth={depth}
            totalBlocks={blocks.length}
            classNameExtra={[
              isFirst ? "start-of-content" : "",
              isLast ? "end-of-content" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          />
        );
      })}
    </div>
  );
}
