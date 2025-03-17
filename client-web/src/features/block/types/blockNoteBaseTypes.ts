import { BaseBlock } from "./baseBlock";
import { DefaultStyleSchema, StyledText } from "@blocknote/core";

// 모든 BlockNote 기반 블록의 기본 인터페이스
export type BlockNoteBaseBlock = BaseBlock;

// 인라인 콘텐츠를 가진 블록 (paragraph, heading, list items 등)
export interface BlockNoteInlineContentBlock extends BlockNoteBaseBlock {
  content: StyledText<DefaultStyleSchema>[];
}
