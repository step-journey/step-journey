import { Extension } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import Heading from "@tiptap/extension-heading";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Blockquote from "@tiptap/extension-blockquote";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";

import CalloutExtension from "./extensions/CalloutExtension";
import PageExtension from "./extensions/PageExtension";
import ToggleListExtension from "./extensions/ToggleListExtension";

// Custom keyboard handler extension
const CustomKeyboardShortcuts = Extension.create({
  name: "customKeyboardShortcuts",

  addKeyboardShortcuts() {
    return {
      // Custom shortcuts can be added here
      "Mod-Alt-1": ({ editor }) => {
        return editor.chain().focus().toggleHeading({ level: 1 }).run();
      },
      "Mod-Alt-2": ({ editor }) => {
        return editor.chain().focus().toggleHeading({ level: 2 }).run();
      },
      "Mod-Alt-3": ({ editor }) => {
        return editor.chain().focus().toggleHeading({ level: 3 }).run();
      },
      "Mod-Shift-8": ({ editor }) => {
        return editor.chain().focus().toggleBulletList().run();
      },
      "Mod-Shift-9": ({ editor }) => {
        return editor.chain().focus().toggleOrderedList().run();
      },
    };
  },
});

// Create extensions for the entire editor
export const createEditorExtensions = (placeholder: string) => [
  StarterKit.configure({
    document: false,
    paragraph: false,
    text: false,
    heading: false,
    bulletList: false,
    orderedList: false,
    listItem: false,
    blockquote: false,
  }),
  Document,
  Paragraph,
  Text,
  Underline,
  Highlight,
  Heading.configure({
    levels: [1, 2, 3],
  }),
  BulletList.configure({
    HTMLAttributes: {
      class: "list-disc pl-6",
    },
  }),
  OrderedList.configure({
    HTMLAttributes: {
      class: "list-decimal pl-6",
    },
  }),
  ListItem,
  TaskList.configure({
    HTMLAttributes: {
      class: "not-prose pl-2",
    },
  }),
  TaskItem.configure({
    nested: true,
    HTMLAttributes: {
      class: "flex items-start gap-2 my-1",
    },
  }),
  Blockquote.configure({
    HTMLAttributes: {
      class: "border-l-4 border-muted pl-4 italic my-4",
    },
  }),
  Table.configure({
    resizable: true,
    HTMLAttributes: {
      class: "border-collapse w-full my-4",
    },
  }),
  TableRow,
  TableCell.configure({
    HTMLAttributes: {
      class: "border border-border p-2",
    },
  }),
  TableHeader.configure({
    HTMLAttributes: {
      class: "border border-border p-2 bg-muted/30 font-medium",
    },
  }),
  CalloutExtension,
  PageExtension,
  ToggleListExtension,
  CustomKeyboardShortcuts,
  Placeholder.configure({
    placeholder,
    includeChildren: true,
  }),
];

// 블록 타입별 확장 기능 캐시
const blockExtensionsCache = new Map();

// Create extensions for individual blocks
export const createBlockExtension = (
  blockType: string,
  placeholder: string,
) => {
  // 캐시 키 생성
  const cacheKey = `${blockType}-${placeholder}`;

  // 캐시에서 찾기
  if (blockExtensionsCache.has(cacheKey)) {
    return blockExtensionsCache.get(cacheKey);
  }

  let extensions;

  // 기본 확장 기능
  const baseExtensions = [
    Document,
    Text,
    Paragraph.configure({
      HTMLAttributes: {
        class: "",
      },
    }),
    Placeholder.configure({
      placeholder,
      includeChildren: true,
    }),
  ];

  // 블록 타입별 추가 확장 기능
  switch (blockType) {
    case "heading":
      extensions = [
        ...baseExtensions,
        Heading.configure({ levels: [1, 2, 3] }),
      ];
      break;
    case "bulletList":
      extensions = [
        ...baseExtensions,
        BulletList.configure({ HTMLAttributes: { class: "list-disc pl-6" } }),
        ListItem,
      ];
      break;
    case "orderedList":
      extensions = [
        ...baseExtensions,
        OrderedList.configure({
          HTMLAttributes: { class: "list-decimal pl-6" },
        }),
        ListItem,
      ];
      break;
    case "taskList":
      extensions = [
        ...baseExtensions,
        TaskList.configure({ HTMLAttributes: { class: "not-prose pl-2" } }),
        TaskItem.configure({
          nested: true,
          HTMLAttributes: { class: "flex items-start gap-2 my-1" },
        }),
      ];
      break;
    case "blockquote":
      extensions = [
        ...baseExtensions,
        Blockquote.configure({
          HTMLAttributes: { class: "border-l-4 border-muted pl-4 italic" },
        }),
      ];
      break;
    case "table":
      extensions = [
        ...baseExtensions,
        Table.configure({
          resizable: true,
          HTMLAttributes: { class: "border-collapse w-full" },
        }),
        TableRow,
        TableCell.configure({
          HTMLAttributes: { class: "border border-border p-2" },
        }),
        TableHeader.configure({
          HTMLAttributes: {
            class: "border border-border p-2 bg-muted/30 font-medium",
          },
        }),
      ];
      break;
    case "callout":
      extensions = [...baseExtensions, CalloutExtension];
      break;
    case "page":
      extensions = [...baseExtensions, PageExtension];
      break;
    case "toggleList":
      extensions = [...baseExtensions, ToggleListExtension];
      break;
    default:
      extensions = baseExtensions;
  }

  // 캐시에 저장
  blockExtensionsCache.set(cacheKey, extensions);

  return extensions;
};
