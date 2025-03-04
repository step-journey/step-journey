import { Editor } from "@tiptap/react";
import React, { useCallback, useState } from "react";
import {
  IconHeading,
  IconList,
  IconListNumbers,
  IconListCheck,
  IconChevronRight,
  IconFileText,
  IconInfoCircle,
  IconQuote,
  IconTable,
  IconSeparator,
  IconLetterT,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BlockMenuProps {
  editor: Editor;
  onClose?: () => void;
}

interface BlockItem {
  title: string;
  icon: React.ReactNode;
  action: (editor: Editor) => void;
  isActive?: (editor: Editor) => boolean;
}

const BlockMenu = ({ editor, onClose }: BlockMenuProps) => {
  const [activeCategory, setActiveCategory] = useState("basic");

  const blockItems: BlockItem[] = [
    {
      title: "Text",
      icon: <IconLetterT size={18} />,
      action: (editor) => editor.chain().focus().setParagraph().run(),
      isActive: (editor) => editor.isActive("paragraph"),
    },
    {
      title: "Heading 1",
      icon: <IconHeading size={18} />,
      action: (editor) =>
        editor.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: (editor) => editor.isActive("heading", { level: 1 }),
    },
    {
      title: "Heading 2",
      icon: <IconHeading size={18} stroke={2.5} />,
      action: (editor) =>
        editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: (editor) => editor.isActive("heading", { level: 2 }),
    },
    {
      title: "Heading 3",
      icon: <IconHeading size={18} stroke={2} />,
      action: (editor) =>
        editor.chain().focus().toggleHeading({ level: 3 }).run(),
      isActive: (editor) => editor.isActive("heading", { level: 3 }),
    },
    {
      title: "Bullet List",
      icon: <IconList size={18} />,
      action: (editor) => editor.chain().focus().toggleBulletList().run(),
      isActive: (editor) => editor.isActive("bulletList"),
    },
    {
      title: "Numbered List",
      icon: <IconListNumbers size={18} />,
      action: (editor) => editor.chain().focus().toggleOrderedList().run(),
      isActive: (editor) => editor.isActive("orderedList"),
    },
    {
      title: "Task List",
      icon: <IconListCheck size={18} />,
      action: (editor) => editor.chain().focus().toggleTaskList().run(),
      isActive: (editor) => editor.isActive("taskList"),
    },
    {
      title: "Toggle List",
      icon: <IconChevronRight size={18} />,
      action: (editor) => editor.chain().focus().toggleList().run(),
      isActive: (editor) => editor.isActive("toggleList"),
    },
    {
      title: "Page",
      icon: <IconFileText size={18} />,
      action: (editor) => editor.chain().focus().setPage().run(),
      isActive: (editor) => editor.isActive("page"),
    },
    {
      title: "Callout",
      icon: <IconInfoCircle size={18} />,
      action: (editor) => editor.chain().focus().setCallout().run(),
      isActive: (editor) => editor.isActive("callout"),
    },
    {
      title: "Quote",
      icon: <IconQuote size={18} />,
      action: (editor) => editor.chain().focus().toggleBlockquote().run(),
      isActive: (editor) => editor.isActive("blockquote"),
    },
    {
      title: "Table",
      icon: <IconTable size={18} />,
      action: (editor) =>
        editor
          .chain()
          .focus()
          .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
          .run(),
    },
    {
      title: "Divider",
      icon: <IconSeparator size={18} />,
      action: (editor) => editor.chain().focus().setHorizontalRule().run(),
    },
  ];

  const handleSelectBlock = useCallback(
    (item: BlockItem) => {
      item.action(editor);
      onClose?.();
    },
    [editor, onClose],
  );

  return (
    <div className="block-menu border border-border rounded-lg shadow-md bg-popover overflow-hidden">
      <div className="p-2 border-b border-border">
        <div className="text-sm font-medium">Insert block</div>
      </div>

      <div className="p-1 max-h-[300px] overflow-y-auto">
        {blockItems.map((item, index) => (
          <Button
            key={index}
            variant="ghost"
            className={cn(
              "w-full justify-start text-left mb-1",
              item.isActive?.(editor) && "bg-muted",
            )}
            onClick={() => handleSelectBlock(item)}
          >
            <span className="mr-2">{item.icon}</span>
            {item.title}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default BlockMenu;
