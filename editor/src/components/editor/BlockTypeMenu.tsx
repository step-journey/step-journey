import { useEffect, useRef } from "react";
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

interface BlockTypeMenuProps {
  position: { x: number; y: number };
  onSelect: (type: string) => void;
  onClose: () => void;
}

const blockTypes = [
  {
    type: "paragraph",
    label: "Text",
    description: "Just start writing with plain text",
    icon: <IconLetterT size={18} />,
  },
  {
    type: "heading",
    attrs: { level: 1 },
    label: "Heading 1",
    description: "Large section heading",
    icon: <IconHeading size={18} />,
  },
  {
    type: "heading",
    attrs: { level: 2 },
    label: "Heading 2",
    description: "Medium section heading",
    icon: <IconHeading size={18} />,
  },
  {
    type: "heading",
    attrs: { level: 3 },
    label: "Heading 3",
    description: "Small section heading",
    icon: <IconHeading size={18} />,
  },
  {
    type: "bulletList",
    label: "Bullet List",
    description: "Create a simple bullet list",
    icon: <IconList size={18} />,
  },
  {
    type: "orderedList",
    label: "Numbered List",
    description: "Create a list with numbering",
    icon: <IconListNumbers size={18} />,
  },
  {
    type: "taskList",
    label: "To-do List",
    description: "Track tasks with a to-do list",
    icon: <IconListCheck size={18} />,
  },
  {
    type: "toggleList",
    label: "Toggle List",
    description: "Content that can be collapsed",
    icon: <IconChevronRight size={18} />,
  },
  {
    type: "page",
    label: "Page",
    description: "Embed a sub-page",
    icon: <IconFileText size={18} />,
  },
  {
    type: "callout",
    label: "Callout",
    description: "Make the text stand out",
    icon: <IconInfoCircle size={18} />,
  },
  {
    type: "blockquote",
    label: "Quote",
    description: "Capture a quote",
    icon: <IconQuote size={18} />,
  },
  {
    type: "table",
    label: "Table",
    description: "Add a simple table",
    icon: <IconTable size={18} />,
  },
  {
    type: "horizontalRule",
    label: "Divider",
    description: "Visual divider between content",
    icon: <IconSeparator size={18} />,
  },
];

const BlockTypeMenu = ({ position, onSelect, onClose }: BlockTypeMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-popover border border-border rounded-md shadow-md w-72 overflow-hidden"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <div className="py-1 px-2 text-xs font-medium text-muted-foreground bg-muted/30 border-b border-border">
        Basic blocks
      </div>
      <div className="max-h-60 overflow-y-auto">
        {blockTypes.map((blockType) => (
          <button
            key={`${blockType.type}-${blockType.label}`}
            className="flex items-start w-full px-2 py-1 text-left hover:bg-muted/50 gap-2"
            onClick={() => onSelect(blockType.type)}
          >
            <div className="p-1 mt-0.5 rounded bg-muted/50 text-foreground">
              {blockType.icon}
            </div>
            <div>
              <div className="font-medium text-sm">{blockType.label}</div>
              <div className="text-xs text-muted-foreground">
                {blockType.description}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BlockTypeMenu;
