import { BlockType } from "./baseBlock";
import { BlockNoteBaseBlock } from "./blockNoteBaseTypes";

/**
 * 컬럼 리스트 블록 - 여러 컬럼을 포함하는 컨테이너
 */
export interface ColumnListBlock extends BlockNoteBaseBlock {
  type: BlockType.COLUMN_LIST;
  properties: Record<string, unknown>; // DefaultBlockSchema 직접 참조 대신 일반 객체 타입 사용
}

/**
 * 컬럼 블록 - 컬럼 리스트 내에서 개별 컬럼 (다른 블록들을 포함할 수 있음)
 */
export interface ColumnBlock extends BlockNoteBaseBlock {
  type: BlockType.COLUMN;
  properties: {
    width: number; // 컬럼 너비 비율 (기본값: 1)
  };
}

/**
 * 컬럼 리스트 블록 타입 가드
 * @param block 확인할 블록
 * @returns 블록이 ColumnListBlock이면 true 반환
 */
export function isColumnListBlock(block: any): block is ColumnListBlock {
  return block?.type === BlockType.COLUMN_LIST;
}

/**
 * 컬럼 블록 타입 가드
 * @param block 확인할 블록
 * @returns 블록이 ColumnBlock이면 true 반환
 */
export function isColumnBlock(block: any): block is ColumnBlock {
  return block?.type === BlockType.COLUMN;
}
