import { BlockType } from "@/types/block";
import {
  IconHeading,
  IconLetterT,
  IconList,
  IconListNumbers,
  IconCheck,
  IconChevronRight,
  IconMessageCircle,
  IconQuote,
  IconSeparator,
  IconTable,
} from "@tabler/icons-react";
import React from "react";

// 블록 타입별 아이콘 정의
export const BLOCK_ICONS: Record<BlockType, React.ReactNode> = {
  text: <IconLetterT />,
  heading_1: <IconHeading />,
  heading_2: <IconHeading className="h-4 w-4" />,
  heading_3: <IconHeading className="h-3 w-3" />,
  bulleted_list: <IconList />,
  numbered_list: <IconListNumbers />,
  to_do: <IconCheck />,
  toggle: <IconChevronRight />,
  callout: <IconMessageCircle />,
  quote: <IconQuote />,
  divider: <IconSeparator />,
  table: <IconTable />,
  page: <IconLetterT />,
};

// 블록 타입별 라벨
export const BLOCK_LABELS: Record<BlockType, string> = {
  text: "Text",
  heading_1: "Heading 1",
  heading_2: "Heading 2",
  heading_3: "Heading 3",
  bulleted_list: "Bulleted List",
  numbered_list: "Numbered List",
  to_do: "To-do List",
  toggle: "Toggle List",
  callout: "Callout",
  quote: "Quote",
  divider: "Divider",
  table: "Table",
  page: "Page",
};

// 블록 타입별 설명
export const BLOCK_DESCRIPTIONS: Record<BlockType, string> = {
  text: "Just start writing with plain text.",
  heading_1: "Big section heading.",
  heading_2: "Medium section heading.",
  heading_3: "Small section heading.",
  bulleted_list: "Create a simple bulleted list.",
  numbered_list: "Create a list with numbering.",
  to_do: "Track tasks with a to-do list.",
  toggle: "Toggles can hide and show content.",
  callout: "Make your text stand out.",
  quote: "Capture a quote.",
  divider: "Visually divide blocks.",
  table: "Add a table.",
  page: "Create a new page inside this page.",
};

// 자주 사용되는 블록 타입 배열
export const COMMON_BLOCK_TYPES: BlockType[] = [
  "text",
  "heading_1",
  "heading_2",
  "heading_3",
  "bulleted_list",
  "numbered_list",
  "to_do",
  "toggle",
  "callout",
  "quote",
  "divider",
  "table",
];
