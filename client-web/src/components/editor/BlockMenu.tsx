import { useRef, useEffect } from "react";
import { BlockType } from "@/types/block";
import { IconCopy, IconTransform, IconPalette } from "@tabler/icons-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BLOCK_ICONS, BLOCK_LABELS } from "./blocks/BlockTypes";

interface BlockMenuProps {
  onSelect: (type: BlockType) => void;
  onClose: () => void;
  onDuplicate?: () => void;
  onTurnInto?: (type: BlockType) => void;
  onChangeColor?: (color: string) => void;
}

/**
 * BlockMenu - A menu that appears when clicking the "⋮⋮" (six dots) icon
 *
 * Note: This menu does NOT appear on hover. Only the "⋮⋮" icon appears on hover.
 * This menu only appears AFTER clicking the six dots icon that shows up when hovering over a block.
 *
 * The menu provides core action options for a content block:
 * - Duplicate: Create an exact copy of the block
 * - Turn into: Transform the block into another type
 * - Color: Change text color or background color (for supported blocks)
 *
 * @param {BlockMenuProps} props - The component props
 * @returns {JSX.Element} The rendered menu component
 */
export default function BlockMenu({
  onSelect,
  onClose,
  onDuplicate,
  onTurnInto,
  onChangeColor,
}: BlockMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    /**
     * Handles clicks outside the menu to close it
     * @param {MouseEvent} event - The mouse event
     */
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

  // Most commonly used block types for the "Turn into" submenu
  const commonBlockTypes: BlockType[] = [
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
    "image",
    "bookmark",
  ];

  // Available colors for text and background
  const colors = [
    { name: "Default", value: "" },
    { name: "Gray", value: "gray" },
    { name: "Brown", value: "brown" },
    { name: "Orange", value: "orange" },
    { name: "Yellow", value: "yellow" },
    { name: "Green", value: "green" },
    { name: "Blue", value: "blue" },
    { name: "Purple", value: "purple" },
    { name: "Pink", value: "pink" },
    { name: "Red", value: "red" },
  ];

  return (
    <div
      ref={menuRef}
      className="absolute z-50 bg-popover border border-border rounded-md shadow-md w-48"
    >
      <div className="py-1">
        {/* Duplicate option */}
        <button
          className="flex items-center w-full px-4 py-2 text-sm hover:bg-accent"
          onClick={onDuplicate}
          disabled={!onDuplicate}
        >
          <span className="mr-2">
            <IconCopy size={16} />
          </span>
          Duplicate
        </button>

        {/* Turn into submenu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center justify-between w-full px-4 py-2 text-sm hover:bg-accent">
              <div className="flex items-center">
                <span className="mr-2">
                  <IconTransform size={16} />
                </span>
                Turn into
              </div>
              <span>▶</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48" align="start" side="right">
            {commonBlockTypes.map((type) => (
              <DropdownMenuItem
                key={type}
                onClick={() => (onTurnInto ? onTurnInto(type) : onSelect(type))}
              >
                <span className="mr-2">{BLOCK_ICONS[type]}</span>
                {BLOCK_LABELS[type]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Color submenu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center justify-between w-full px-4 py-2 text-sm hover:bg-accent">
              <div className="flex items-center">
                <span className="mr-2">
                  <IconPalette size={16} />
                </span>
                Color
              </div>
              <span>▶</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48" align="start" side="right">
            {colors.map((color) => (
              <DropdownMenuItem
                key={color.value}
                onClick={() => onChangeColor && onChangeColor(color.value)}
              >
                <div className="flex items-center">
                  {color.value ? (
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: color.value }}
                    />
                  ) : (
                    <div className="w-3 h-3 rounded-full mr-2 border border-gray-300" />
                  )}
                  {color.name}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
