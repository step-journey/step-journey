import { BlockType } from "./baseBlock";
import { BlockNoteInlineContentBlock } from "./blockNoteBaseTypes";
import { DefaultBlockSchema, Props } from "@blocknote/core";

export interface HeadingBlock extends BlockNoteInlineContentBlock {
  type: BlockType.HEADING;
  properties: Props<DefaultBlockSchema["heading"]["propSchema"]>;
}

// 타입 가드 함수
export function isHeadingBlock(block: any): block is HeadingBlock {
  return block?.type === BlockType.HEADING;
}
