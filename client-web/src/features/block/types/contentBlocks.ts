/**
 * BlockNote 블록에 매핑되는 커스텀 블록 타입들
 */
import { BaseBlock, BaseBlockProperties, BlockType } from "./baseBlock";

// 공통 콘텐츠 블록 프로퍼티 - BlockNote 공통 속성
export interface ContentBlockProperties extends BaseBlockProperties {
  textColor?: string;
  backgroundColor?: string;
  textAlignment?: "left" | "center" | "right" | "justify";
}

// 텍스트 스타일
export interface TextStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  code?: boolean;
  textColor?: string;
}

// 인라인 텍스트 콘텐츠
export interface TextContent {
  type: "text";
  text: string;
  styles: TextStyle;
}

// 인라인 콘텐츠 타입 (현재는 텍스트만 지원)
export type InlineContent = TextContent;

// 기본 콘텐츠 블록 인터페이스 (BlockNote 텍스트 블록 기반)
export interface ContentBlock extends BaseBlock {
  content: InlineContent[];
}

// 단락 블록 - BlockNote paragraph
export interface ParagraphBlock extends ContentBlock {
  type: BlockType.PARAGRAPH;
  properties: ContentBlockProperties;
}

// 헤딩 블록 - BlockNote heading
export interface HeadingBlockProperties extends ContentBlockProperties {
  level: 1 | 2 | 3 | 4 | 5 | 6;
}

export interface HeadingBlock extends ContentBlock {
  type: BlockType.HEADING;
  properties: HeadingBlockProperties;
}

// 글머리 기호 목록 항목 - BlockNote bulletListItem
export interface BulletListItemBlock extends ContentBlock {
  type: BlockType.BULLET_LIST_ITEM;
  properties: ContentBlockProperties;
}

// 번호 목록 항목 - BlockNote numberedListItem
export interface NumberedListItemBlockProperties
  extends ContentBlockProperties {
  start?: number; // start 속성 추가
}

export interface NumberedListItemBlock extends ContentBlock {
  type: BlockType.NUMBERED_LIST_ITEM;
  properties: NumberedListItemBlockProperties;
}

// 체크리스트 항목 - BlockNote checkListItem
export interface CheckListItemProperties extends ContentBlockProperties {
  checked: boolean;
}

export interface CheckListItemBlock extends ContentBlock {
  type: BlockType.CHECK_LIST_ITEM;
  properties: CheckListItemProperties;
}

// 코드 블록 - BlockNote codeBlock
export interface CodeBlockProperties {
  language: string;
}

export interface CodeBlock extends ContentBlock {
  type: BlockType.CODE_BLOCK;
  properties: CodeBlockProperties;
}

// 테이블 셀 - BlockNote tableCell
export interface TableCellProperties {
  colspan: number;
  rowspan: number;
  backgroundColor: string;
  textColor: string;
  textAlignment: "left" | "center" | "right" | "justify";
}

export interface TableCell {
  type: "tableCell";
  content: InlineContent[];
  props: TableCellProperties;
}

// 테이블 콘텐츠 - BlockNote tableContent
export interface TableContent {
  type: "tableContent";
  columnWidths: (number | null)[];
  rows: {
    cells: TableCell[];
  }[];
}

// 테이블 블록 - BlockNote table
export interface TableBlockProperties {
  textColor: string;
}

export interface TableBlock extends BaseBlock {
  type: BlockType.TABLE;
  properties: TableBlockProperties;
  tableContent: TableContent;
}

// 이미지 블록 - BlockNote image
export interface ImageBlockProperties extends ContentBlockProperties {
  name: string;
  url: string;
  caption: string;
  showPreview: boolean;
  previewWidth: number;
  backgroundColor?: string;
  textAlignment?: "left" | "center" | "right" | "justify";
}

export interface ImageBlock extends BaseBlock {
  type: BlockType.IMAGE;
  properties: ImageBlockProperties;
}

// 타입 가드 함수들
export function isParagraphBlock(block: any): block is ParagraphBlock {
  return block?.type === BlockType.PARAGRAPH;
}

export function isHeadingBlock(block: any): block is HeadingBlock {
  return block?.type === BlockType.HEADING;
}

export function isBulletListItemBlock(
  block: any,
): block is BulletListItemBlock {
  return block?.type === BlockType.BULLET_LIST_ITEM;
}

export function isNumberedListItemBlock(
  block: any,
): block is NumberedListItemBlock {
  return block?.type === BlockType.NUMBERED_LIST_ITEM;
}

export function isCheckListItemBlock(block: any): block is CheckListItemBlock {
  return block?.type === BlockType.CHECK_LIST_ITEM;
}

export function isCodeBlock(block: any): block is CodeBlock {
  return block?.type === BlockType.CODE_BLOCK;
}

export function isTableBlock(block: any): block is TableBlock {
  return block?.type === BlockType.TABLE;
}

export function isImageBlock(block: any): block is ImageBlock {
  return block?.type === BlockType.IMAGE;
}

// 모든 콘텐츠 블록 타입의 유니온 타입
export type ContentBlockUnion =
  | ParagraphBlock
  | HeadingBlock
  | BulletListItemBlock
  | NumberedListItemBlock
  | CheckListItemBlock
  | CodeBlock
  | TableBlock
  | ImageBlock;

// 콘텐츠 블록 여부 체크
export function isContentBlock(block: any): block is ContentBlockUnion {
  return [
    BlockType.PARAGRAPH,
    BlockType.HEADING,
    BlockType.BULLET_LIST_ITEM,
    BlockType.NUMBERED_LIST_ITEM,
    BlockType.CHECK_LIST_ITEM,
    BlockType.CODE_BLOCK,
    BlockType.TABLE,
    BlockType.IMAGE,
  ].includes(block?.type);
}
