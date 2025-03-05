import { v4 as uuidv4 } from "uuid";

// 블록 타입을 명확히 정의
export type BlockType =
  | "page"
  | "text"
  | "heading_1"
  | "heading_2"
  | "heading_3"
  | "bulleted_list"
  | "numbered_list"
  | "to_do"
  | "toggle"
  | "callout"
  | "quote"
  | "divider"
  | "table";

// 공통 블록 인터페이스 확장
export interface Block {
  id: string;
  type: BlockType;
  properties: Record<string, Array<[string, Array<TextFormat>]>>;
  content: string[]; // 자식 블록 ID 배열
  parent: string | null;
  format?: Record<string, any>; // 블록 포맷 정보 (색상, 정렬 등)
  created_at: string;
  updated_at: string;
  created_by?: string;
  last_edited_by?: string;
}

// 모든 가능한 텍스트 서식 지원
export type TextFormat =
  | ["b"] // 굵게
  | ["i"] // 이탤릭
  | ["u"] // 밑줄
  | ["s"] // 취소선
  | ["c"] // 인라인 코드
  | ["a", string] // 링크
  | ["h", string] // 하이라이트 색상
  | ["p", string] // 텍스트 색상
  | ["m", string]; // 수식

export interface TextBlock extends Block {
  type: "text";
  properties: {
    title: Array<[string, Array<TextFormat>]>;
  };
}

export interface HeadingBlock extends Block {
  type: "heading_1" | "heading_2" | "heading_3";
  properties: {
    title: Array<[string, Array<TextFormat>]>;
  };
}

export interface ListBlock extends Block {
  type: "bulleted_list" | "numbered_list";
  properties: {
    title: Array<[string, Array<TextFormat>]>;
  };
}

export interface ToDoBlock extends Block {
  type: "to_do";
  properties: {
    title: Array<[string, Array<TextFormat>]>;
    checked: Array<[string, Array<TextFormat>]>;
  };
}

export interface ToggleBlock extends Block {
  type: "toggle";
  properties: {
    title: Array<[string, Array<TextFormat>]>;
  };
}

export interface PageBlock extends Block {
  type: "page";
  properties: {
    title: Array<[string, Array<TextFormat>]>;
  };
}

export function createBlock(
  type: BlockType,
  parentId: string | null = null,
): Block {
  return {
    id: uuidv4(),
    type,
    properties: {},
    content: [],
    parent: parentId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function createTextBlock(parentId: string | null = null): TextBlock {
  return {
    ...createBlock("text", parentId),
    properties: {
      title: [["", []]],
    },
  } as TextBlock;
}

export function createPageBlock(
  title: string = "",
  parentId: string | null = null,
): PageBlock {
  return {
    ...createBlock("page", parentId),
    properties: {
      title: [[title, []]],
    },
  } as PageBlock;
}

// 블록 딥 클론 유틸리티 함수
export function cloneBlock(block: Block, newParentId?: string | null): Block {
  const newBlock = {
    ...block,
    id: uuidv4(),
    parent: newParentId !== undefined ? newParentId : block.parent,
    content: [], // 자식 블록은 별도로 클론해야 함
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return newBlock;
}
