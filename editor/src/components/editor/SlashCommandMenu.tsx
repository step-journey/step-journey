import React, { useCallback, useEffect, useState } from "react";
import { Editor } from "@tiptap/react";
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
import { cn } from "@/lib/utils";

interface SlashCommandMenuProps {
  editor: Editor;
}

interface CommandItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  command: (editor: Editor) => void;
}

const SlashCommandMenu = ({ editor }: SlashCommandMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commandItems: CommandItem[] = [
    {
      title: "Text",
      description: "Just start writing with plain text",
      icon: <IconLetterT size={18} />,
      command: (editor) => editor.chain().focus().setParagraph().run(),
    },
    {
      title: "Heading 1",
      description: "Large section heading",
      icon: <IconHeading size={18} />,
      command: (editor) =>
        editor.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      title: "Heading 2",
      description: "Medium section heading",
      icon: <IconHeading size={18} stroke={2.5} />,
      command: (editor) =>
        editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      title: "Heading 3",
      description: "Small section heading",
      icon: <IconHeading size={18} stroke={2} />,
      command: (editor) =>
        editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      title: "Bullet List",
      description: "Create a simple bullet list",
      icon: <IconList size={18} />,
      command: (editor) => editor.chain().focus().toggleBulletList().run(),
    },
    {
      title: "Numbered List",
      description: "Create a list with numbering",
      icon: <IconListNumbers size={18} />,
      command: (editor) => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      title: "Task List",
      description: "Track tasks with a to-do list",
      icon: <IconListCheck size={18} />,
      command: (editor) => editor.chain().focus().toggleTaskList().run(),
    },
    {
      title: "Toggle List",
      description: "Content that can be collapsed",
      icon: <IconChevronRight size={18} />,
      // 수정: setToggleList → toggleList 명령으로 변경
      command: (editor) => editor.chain().focus().toggleList().run(),
    },
    {
      title: "Page",
      description: "Embed a sub-page",
      icon: <IconFileText size={18} />,
      command: (editor) => editor.chain().focus().setPage().run(),
    },
    {
      title: "Callout",
      description: "Make the text stand out",
      icon: <IconInfoCircle size={18} />,
      command: (editor) => editor.chain().focus().setCallout().run(),
    },
    {
      title: "Quote",
      description: "Capture a quote",
      icon: <IconQuote size={18} />,
      command: (editor) => editor.chain().focus().toggleBlockquote().run(),
    },
    {
      title: "Table",
      description: "Add a simple table",
      icon: <IconTable size={18} />,
      command: (editor) =>
        editor
          .chain()
          .focus()
          .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
          .run(),
    },
    {
      title: "Divider",
      description: "Visual divider between content",
      icon: <IconSeparator size={18} />,
      command: (editor) => editor.chain().focus().setHorizontalRule().run(),
    },
  ];

  const checkForSlashCommand = useCallback(() => {
    if (!editor) return;

    const { state } = editor;
    const { selection } = state;
    const { $from, from, to } = selection;

    // Check if the cursor is at the start of a textblock
    if (!$from.parent.type.isTextblock) {
      setIsOpen(false);
      return;
    }

    // Get text around cursor
    const textBeforeCursor = $from.parent.textBetween(
      Math.max(0, $from.parentOffset - 1),
      $from.parentOffset,
      null,
      "",
    );

    if (textBeforeCursor === "/") {
      setIsOpen(true);
      setSelectedIndex(0);
    } else {
      setIsOpen(false);
    }
  }, [editor]);

  // Effect to set up event listeners
  useEffect(() => {
    if (!editor) return;

    // Check for the slash command on each keyup
    const updateListener = () => {
      checkForSlashCommand();
    };

    editor.on("update", updateListener);

    // Keyboard navigation for the menu
    const keydownListener = (event: KeyboardEvent) => {
      if (!isOpen) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedIndex((prev) =>
          prev < commandItems.length - 1 ? prev + 1 : prev,
        );
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      }

      if (event.key === "Enter" && isOpen) {
        event.preventDefault();
        executeCommand(selectedIndex);
      }

      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", keydownListener);

    return () => {
      editor.off("update", updateListener);
      document.removeEventListener("keydown", keydownListener);
    };
  }, [
    editor,
    isOpen,
    checkForSlashCommand,
    selectedIndex,
    commandItems.length,
  ]);

  const executeCommand = (index: number) => {
    if (!editor) return;

    // First, delete the slash character
    editor
      .chain()
      .focus()
      .deleteRange({
        from: editor.state.selection.$from.pos - 1,
        to: editor.state.selection.$from.pos,
      })
      .run();

    // Then execute the selected command
    commandItems[index].command(editor);
    setIsOpen(false);
  };

  if (!isOpen || !editor) {
    return null;
  }

  const { top, left } = editor.view.coordsAtPos(editor.state.selection.from);

  return (
    <div
      className="absolute z-50 bg-popover border border-border rounded-md shadow-md w-72 overflow-hidden"
      style={{
        top: `${top + 20}px`,
        left: `${left}px`,
      }}
    >
      <div className="py-1 px-2 text-xs font-medium text-muted-foreground bg-muted/30 border-b border-border">
        Basic blocks
      </div>
      <div className="max-h-60 overflow-y-auto">
        {commandItems.map((item, index) => (
          <button
            key={item.title}
            className={cn(
              "flex items-start w-full px-2 py-1 text-left hover:bg-muted/50 gap-2",
              selectedIndex === index && "bg-muted/80",
            )}
            onClick={() => executeCommand(index)}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <div className="p-1 mt-0.5 rounded bg-muted/50 text-foreground">
              {item.icon}
            </div>
            <div>
              <div className="font-medium text-sm">{item.title}</div>
              <div className="text-xs text-muted-foreground">
                {item.description}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SlashCommandMenu;
