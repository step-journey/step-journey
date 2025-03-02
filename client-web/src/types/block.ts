import { v4 as uuidv4 } from "uuid";

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
  | "image"
  | "code"
  | "bookmark";

export interface Block {
  id: string;
  type: BlockType;
  properties: Record<string, any>;
  content: string[]; // Child block IDs
  parent: string | null; // Parent block ID
  created_at: string;
  updated_at: string;
}

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
    checked: Array<["Yes" | "No"]>;
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

export type TextFormat =
  | ["b"] // bold
  | ["i"] // italic
  | ["u"] // underline
  | ["s"] // strikethrough
  | ["c"] // code
  | ["a", string] // link
  | ["h", string]; // highlight color

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
