import { Block, BlockType } from "../types";

/**
 * 블록 ID에 해당하는 블록을 찾는 함수
 *
 * @param blockId 찾을 블록 ID
 * @param allBlocks 모든 블록 목록
 * @returns 찾은 블록 또는 undefined
 */
export function findBlockById(
  blockId: string,
  allBlocks: Block[],
): Block | undefined {
  return allBlocks.find((block) => block.id === blockId);
}

/**
 * 특정 블록 타입에 해당하는 자식 블록들을 찾는 함수
 *
 * @param parentId 부모 블록 ID
 * @param blockType 찾을 블록 타입
 * @param allBlocks 모든 블록 목록
 * @returns 찾은 블록 목록
 */
export function findChildBlocksByType(
  parentId: string,
  blockType: BlockType,
  allBlocks: Block[],
): Block[] {
  return allBlocks.filter(
    (block) => block.parentId === parentId && block.type === blockType,
  );
}
