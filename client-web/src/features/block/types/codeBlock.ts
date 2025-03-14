import { BlockType } from "./baseBlock";
import { BlockNoteInlineContentBlock } from "./blockNoteBaseTypes";
import { DefaultBlockSchema, Props } from "@blocknote/core";

export interface CodeBlock extends BlockNoteInlineContentBlock {
  type: BlockType.CODE_BLOCK;
  properties: Props<DefaultBlockSchema["codeBlock"]["propSchema"]>;
}

// 타입 가드 함수
export function isCodeBlock(block: any): block is CodeBlock {
  return block?.type === BlockType.CODE_BLOCK;
}
