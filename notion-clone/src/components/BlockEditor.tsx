import { BlockNoteEditor } from "@blocknote/core";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@/styles/text-editor.css";

export function BlockEditor() {
  const editor: BlockNoteEditor = useCreateBlockNote({
    initialContent: [
      {
        type: "paragraph",
        content: "Welcome to your Notion-like editor! Start typing here...",
      },
    ],
  });

  return (
    <div className="container">
      <div className="editorPanel">
        <BlockNoteView editor={editor} className="editorContainer" />
      </div>
    </div>
  );
}
