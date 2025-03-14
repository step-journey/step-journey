import { BlockType } from "./baseBlock";
import { BlockNoteInlineContentBlock } from "./blockNoteBaseTypes";
import { DefaultBlockSchema, Props } from "@blocknote/core";

export interface BulletListItemBlock extends BlockNoteInlineContentBlock {
  type: BlockType.BULLET_LIST;
  properties: Props<DefaultBlockSchema["bulletListItem"]["propSchema"]>;
}

// 타입 가드 함수
export function isBulletListItemBlock(
  block: any,
): block is BulletListItemBlock {
  return block?.type === BlockType.BULLET_LIST;
}
