import { BlockType } from "./baseBlock";
import { BlockNoteInlineContentBlock } from "./blockNoteBaseTypes";
import { DefaultBlockSchema, Props } from "@blocknote/core";

export interface CheckListItemBlock extends BlockNoteInlineContentBlock {
  type: BlockType.CHECK_LIST;
  properties: Props<DefaultBlockSchema["checkListItem"]["propSchema"]>;
}

// 타입 가드 함수
export function isCheckListItemBlock(block: any): block is CheckListItemBlock {
  return block?.type === BlockType.CHECK_LIST;
}
