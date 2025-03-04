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
  IconCode,
  IconPhoto,
  IconLink,
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
  code: <IconCode />,
  image: <IconPhoto />,
  video: <IconPhoto />,
  file: <IconPhoto />,
  bookmark: <IconLink />,
  page: <IconLetterT />,
  equation: <IconCode />,
  table: <IconSeparator />,
  column: <IconSeparator />,
  column_list: <IconSeparator />,
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
  code: "Code",
  image: "Image",
  video: "Video",
  file: "File",
  bookmark: "Bookmark",
  page: "Page",
  equation: "Equation",
  table: "Table",
  column: "Column",
  column_list: "Column List",
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
  code: "Capture a code snippet.",
  image: "Upload or embed an image.",
  video: "Upload or embed a video.",
  file: "Upload a file.",
  bookmark: "Save a link as a visual bookmark.",
  page: "Create a new page inside this page.",
  equation: "Display a math equation.",
  table: "Add a table.",
  column: "Add a column.",
  column_list: "Add a column list.",
};

// 노션 스타일 클래스명 매핑
export function getNotionBlockClassName(type: BlockType): string {
  switch (type) {
    case "text":
      return "notion-text-block";
    case "heading_1":
    case "heading_2":
    case "heading_3":
      return "notion-header-block";
    case "bulleted_list":
      return "notion-bulleted_list-block notion-synthetic-group-block";
    case "numbered_list":
      return "notion-numbered_list-block notion-synthetic-group-block";
    case "to_do":
      return "notion-to_do-block";
    case "toggle":
      return "notion-toggle-block";
    case "callout":
      return "notion-callout-block";
    case "quote":
      return "notion-quote-block";
    case "divider":
      return "notion-divider-block";
    case "code":
      return "notion-code-block";
    case "image":
      return "notion-image-block";
    default:
      return "notion-text-block";
  }
}

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
  "code",
];
