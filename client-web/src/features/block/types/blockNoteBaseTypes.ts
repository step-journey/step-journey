import { BaseBlock, BaseBlockProperties } from "./baseBlock";
import { DefaultStyleSchema, StyledText } from "@blocknote/core";

// BlockNote 블록들을 위한 공통 프로퍼티
export interface BlockNoteBlockProperties extends BaseBlockProperties {
  textColor?: string;
  backgroundColor?: string;
  textAlignment?: "left" | "center" | "right" | "justify";
}

// 모든 BlockNote 기반 블록의 기본 인터페이스
export type BlockNoteBaseBlock = BaseBlock;

// 인라인 콘텐츠를 가진 블록 (paragraph, heading, list items 등)
export interface BlockNoteInlineContentBlock extends BlockNoteBaseBlock {
  content: StyledText<DefaultStyleSchema>[];
}
