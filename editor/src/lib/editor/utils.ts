import { Editor } from "@tiptap/react";

/**
 * 현재 선택된 노드의 타입을 반환합니다.
 */
export const getCurrentNodeType = (editor: Editor): string | null => {
  if (!editor) return null;

  const { state } = editor;
  const { selection } = state;
  const { $from } = selection;

  if ($from.parent) {
    return $from.parent.type.name;
  }

  return null;
};

/**
 * HTML 형식으로 에디터 내용을 반환합니다.
 */
export const getEditorHTML = (editor: Editor): string => {
  if (!editor) return "";

  return editor.getHTML();
};

/**
 * JSON 형식으로 에디터 내용을 반환합니다.
 */
export const getEditorJSON = (editor: Editor): Record<string, any> => {
  if (!editor) return {};

  return editor.getJSON();
};

/**
 * 에디터 내용을 클리어합니다.
 */
export const clearEditor = (editor: Editor): boolean => {
  if (!editor) return false;

  return editor.commands.clearContent();
};

/**
 * 선택된 텍스트를 특정 마크로 포맷팅합니다.
 */
export const formatText = (
  editor: Editor,
  format: "bold" | "italic" | "underline" | "strike" | "highlight",
): boolean => {
  if (!editor) return false;

  switch (format) {
    case "bold":
      return editor.chain().focus().toggleBold().run();
    case "italic":
      return editor.chain().focus().toggleItalic().run();
    case "underline":
      return editor.chain().focus().toggleUnderline().run();
    case "strike":
      return editor.chain().focus().toggleStrike().run();
    case "highlight":
      return editor.chain().focus().toggleHighlight().run();
    default:
      return false;
  }
};

/**
 * 선택된 블록의 타입을 변경합니다.
 */
export const setBlockType = (
  editor: Editor,
  type:
    | "paragraph"
    | "heading"
    | "bulletList"
    | "orderedList"
    | "taskList"
    | "blockquote"
    | "codeBlock",
  attrs = {},
): boolean => {
  if (!editor) return false;

  switch (type) {
    case "paragraph":
      return editor.chain().focus().setParagraph().run();
    case "heading":
      return editor
        .chain()
        .focus()
        .setHeading(attrs as { level: 1 | 2 | 3 })
        .run();
    case "bulletList":
      return editor.chain().focus().toggleBulletList().run();
    case "orderedList":
      return editor.chain().focus().toggleOrderedList().run();
    case "taskList":
      return editor.chain().focus().toggleTaskList().run();
    case "blockquote":
      return editor.chain().focus().toggleBlockquote().run();
    case "codeBlock":
      return editor.chain().focus().toggleCodeBlock().run();
    default:
      return false;
  }
};
