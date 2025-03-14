import { BlockType } from "./baseBlock";
import { BlockNoteInlineContentBlock } from "./blockNoteBaseTypes";
import { DefaultBlockSchema, Props } from "@blocknote/core";

export interface NumberedListItemBlock extends BlockNoteInlineContentBlock {
  type: BlockType.NUMBERED_LIST;
  properties: Props<DefaultBlockSchema["numberedListItem"]["propSchema"]>;
}

// 타입 가드 함수
export function isNumberedListItemBlock(
  block: any,
): block is NumberedListItemBlock {
  return block?.type === BlockType.NUMBERED_LIST;
}
