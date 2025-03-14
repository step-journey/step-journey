import { BlockType } from "./baseBlock";
import { BlockNoteBaseBlock } from "./blockNoteBaseTypes";
import { DefaultBlockSchema, Props } from "@blocknote/core";

export interface ImageBlock extends BlockNoteBaseBlock {
  type: BlockType.IMAGE;
  properties: Props<DefaultBlockSchema["image"]["propSchema"]>;
}

// 타입 가드 함수
export function isImageBlock(block: any): block is ImageBlock {
  return block?.type === BlockType.IMAGE;
}
