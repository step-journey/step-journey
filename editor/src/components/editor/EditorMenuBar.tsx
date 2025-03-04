import { Editor } from "@tiptap/react";
import {
  IconBold,
  IconItalic,
  IconUnderline,
  IconStrikethrough,
  IconH1,
  IconH2,
  IconH3,
  IconList,
  IconListNumbers,
  IconListCheck,
  IconQuote,
  IconTable,
  IconSeparator,
} from "@tabler/icons-react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

interface EditorMenuBarProps {
  editor: Editor;
}

const EditorMenuBar = ({ editor }: EditorMenuBarProps) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="border-b border-border p-1 flex flex-wrap gap-1 items-center bg-muted/20">
      <Button
        size="sm"
        variant="ghost"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={cn(editor.isActive("bold") && "bg-muted")}
        title="Bold (Ctrl+B)"
      >
        <IconBold size={18} />
      </Button>

      <Button
        size="sm"
        variant="ghost"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={cn(editor.isActive("italic") && "bg-muted")}
        title="Italic (Ctrl+I)"
      >
        <IconItalic size={18} />
      </Button>

      <Button
        size="sm"
        variant="ghost"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={cn(editor.isActive("underline") && "bg-muted")}
        title="Underline (Ctrl+U)"
      >
        <IconUnderline size={18} />
      </Button>

      <Button
        size="sm"
        variant="ghost"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={cn(editor.isActive("strike") && "bg-muted")}
        title="Strikethrough"
      >
        <IconStrikethrough size={18} />
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      <Button
        size="sm"
        variant="ghost"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={cn(editor.isActive("heading", { level: 1 }) && "bg-muted")}
        title="Heading 1"
      >
        <IconH1 size={18} />
      </Button>

      <Button
        size="sm"
        variant="ghost"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={cn(editor.isActive("heading", { level: 2 }) && "bg-muted")}
        title="Heading 2"
      >
        <IconH2 size={18} />
      </Button>

      <Button
        size="sm"
        variant="ghost"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={cn(editor.isActive("heading", { level: 3 }) && "bg-muted")}
        title="Heading 3"
      >
        <IconH3 size={18} />
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      <Button
        size="sm"
        variant="ghost"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={cn(editor.isActive("bulletList") && "bg-muted")}
        title="Bullet List"
      >
        <IconList size={18} />
      </Button>

      <Button
        size="sm"
        variant="ghost"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={cn(editor.isActive("orderedList") && "bg-muted")}
        title="Numbered List"
      >
        <IconListNumbers size={18} />
      </Button>

      <Button
        size="sm"
        variant="ghost"
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        className={cn(editor.isActive("taskList") && "bg-muted")}
        title="Task List"
      >
        <IconListCheck size={18} />
      </Button>

      <Button
        size="sm"
        variant="ghost"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={cn(editor.isActive("blockquote") && "bg-muted")}
        title="Quote"
      >
        <IconQuote size={18} />
      </Button>

      <Button
        size="sm"
        variant="ghost"
        onClick={() =>
          editor
            .chain()
            .focus()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run()
        }
        title="Insert Table"
      >
        <IconTable size={18} />
      </Button>

      <Button
        size="sm"
        variant="ghost"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Divider"
      >
        <IconSeparator size={18} />
      </Button>
    </div>
  );
};

export default EditorMenuBar;
