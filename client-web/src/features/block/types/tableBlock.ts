import { BlockType } from "./baseBlock";
import {
  TableContent,
  DefaultInlineContentSchema,
  DefaultStyleSchema,
  Props,
  DefaultBlockSchema,
} from "@blocknote/core";
import { BlockNoteBaseBlock } from "@/features/block/types/blockNoteBaseTypes";

// 테이블 블록 - BlockNote table
export interface TableBlock extends BlockNoteBaseBlock {
  type: BlockType.TABLE;
  properties: Props<DefaultBlockSchema["table"]["propSchema"]>;
  tableContent: TableContent<DefaultInlineContentSchema, DefaultStyleSchema>;
}

// 타입 가드 함수
export function isTableBlock(block: any): block is TableBlock {
  return block?.type === BlockType.TABLE;
}
