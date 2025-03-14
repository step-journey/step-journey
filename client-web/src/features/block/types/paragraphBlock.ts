import { BlockType } from "./baseBlock";
import { BlockNoteInlineContentBlock } from "./blockNoteBaseTypes";
import { DefaultBlockSchema, Props } from "@blocknote/core";

export interface ParagraphBlock extends BlockNoteInlineContentBlock {
  type: BlockType.PARAGRAPH;
  properties: Props<DefaultBlockSchema["paragraph"]["propSchema"]>;
}

// 타입 가드 함수
export function isParagraphBlock(block: any): block is ParagraphBlock {
  return block?.type === BlockType.PARAGRAPH;
}
