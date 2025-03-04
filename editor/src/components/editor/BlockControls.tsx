import { useState, useRef } from "react";
import {
  IconDots,
  IconTrash,
  IconTransform,
  IconHeading,
  IconList,
  IconListNumbers,
  IconListCheck,
  IconQuote,
  IconInfoCircle,
  IconFileText,
  IconChevronRight,
  IconTable,
  IconSeparator,
  IconLetterT,
} from "@tabler/icons-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Block } from "./Editor";
import { cn } from "@/lib/utils";

interface BlockControlsProps {
  block: Block;
  onConvert: (newType: string, attrs?: Record<string, any>) => void;
  onDelete: () => void;
}

const blockTypes = [
  {
    type: "paragraph",
    label: "Text",
    icon: <IconLetterT size={16} />,
  },
  {
    type: "heading",
    label: "Heading 1",
    icon: <IconHeading size={16} />,
    attrs: { level: 1 },
  },
  {
    type: "heading",
    label: "Heading 2",
    icon: <IconHeading size={16} />,
    attrs: { level: 2 },
  },
  {
    type: "heading",
    label: "Heading 3",
    icon: <IconHeading size={16} />,
    attrs: { level: 3 },
  },
  {
    type: "bulletList",
    label: "Bullet List",
    icon: <IconList size={16} />,
  },
  {
    type: "orderedList",
    label: "Numbered List",
    icon: <IconListNumbers size={16} />,
  },
  {
    type: "taskList",
    label: "To-do List",
    icon: <IconListCheck size={16} />,
  },
  {
    type: "toggleList",
    label: "Toggle List",
    icon: <IconChevronRight size={16} />,
  },
  {
    type: "page",
    label: "Page",
    icon: <IconFileText size={16} />,
  },
  {
    type: "callout",
    label: "Callout",
    icon: <IconInfoCircle size={16} />,
  },
  {
    type: "blockquote",
    label: "Quote",
    icon: <IconQuote size={16} />,
  },
  {
    type: "table",
    label: "Table",
    icon: <IconTable size={16} />,
    attrs: { rows: 3, cols: 3, withHeaderRow: true },
  },
  {
    type: "horizontalRule",
    label: "Divider",
    icon: <IconSeparator size={16} />,
  },
];

const BlockControls = ({ block, onConvert, onDelete }: BlockControlsProps) => {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
      {/* Transform block dropdown */}
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button
            ref={buttonRef}
            className={cn(
              "p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted",
              "opacity-0 group-hover:opacity-100 transition-opacity",
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <IconTransform size={16} />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Turn into</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {blockTypes.map((blockType) => (
            <DropdownMenuItem
              key={`${blockType.type}-${blockType.label}`}
              onClick={() => {
                onConvert(blockType.type, blockType.attrs);
                setOpen(false);
              }}
              className="flex items-center gap-2"
            >
              <span className="text-muted-foreground">{blockType.icon}</span>
              <span>{blockType.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* More actions dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted",
              "opacity-0 group-hover:opacity-100 transition-opacity",
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <IconDots size={16} />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-destructive flex items-center gap-2"
          >
            <IconTrash size={16} />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default BlockControls;
