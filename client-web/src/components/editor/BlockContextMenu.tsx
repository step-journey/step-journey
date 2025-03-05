import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { IconTransform, IconPalette } from "@tabler/icons-react";
import { BlockType } from "@/types/block";
import {
  BLOCK_ICONS,
  BLOCK_LABELS,
  COMMON_BLOCK_TYPES,
} from "./blocks/BlockTypes";
import { cn } from "@/lib/utils";

interface BlockContextMenuProps {
  onTurnInto?: (type: BlockType) => void;
  onChangeColor?: (color: string) => void;
}

/**
 * BlockContextMenu - Notion-style menu, using Radix <DropdownMenuSub> instead of manual hover logic
 */
export default function BlockContextMenu({
  onTurnInto,
  onChangeColor,
}: BlockContextMenuProps) {
  // 텍스트 컬러 목록
  const textColors = [
    { name: "Default text", value: "" },
    { name: "Gray text", value: "gray" },
    { name: "Brown text", value: "brown" },
    { name: "Orange text", value: "orange" },
    { name: "Yellow text", value: "yellow" },
    { name: "Green text", value: "green" },
    { name: "Blue text", value: "blue" },
    { name: "Purple text", value: "purple" },
    { name: "Pink text", value: "pink" },
    { name: "Red text", value: "red" },
  ];

  // 배경 컬러 목록
  const backgroundColors = [
    { name: "Default background", value: "" },
    { name: "Gray background", value: "gray-bg" },
    { name: "Brown background", value: "brown-bg" },
    { name: "Orange background", value: "orange-bg" },
    { name: "Yellow background", value: "yellow-bg" },
    { name: "Green background", value: "green-bg" },
    { name: "Blue background", value: "blue-bg" },
    { name: "Purple background", value: "purple-bg" },
    { name: "Pink background", value: "pink-bg" },
    { name: "Red background", value: "red-bg" },
  ];

  return (
    <DropdownMenuContent align="start" className="block-context-menu w-48 py-1">
      {/* 'Turn into' (Submenu) */}
      <DropdownMenuSub>
        <DropdownMenuSubTrigger className="flex items-center w-full justify-between px-3 py-1.5 text-sm hover:bg-accent cursor-pointer">
          <div className="flex items-center gap-2">
            <IconTransform className="h-4 w-4" />
            <span>Turn into</span>
          </div>
        </DropdownMenuSubTrigger>

        <DropdownMenuSubContent className="w-48 py-1">
          {COMMON_BLOCK_TYPES.map((type) => (
            <DropdownMenuItem
              key={type}
              onClick={() => onTurnInto?.(type)}
              className="gap-2"
            >
              <span>{BLOCK_ICONS[type]}</span>
              <span>{BLOCK_LABELS[type]}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuSub>

      <DropdownMenuSeparator className="my-1" />

      {/* 'Color' (Submenu) */}
      <DropdownMenuSub>
        <DropdownMenuSubTrigger className="flex items-center w-full justify-between px-3 py-1.5 text-sm hover:bg-accent cursor-pointer">
          <div className="flex items-center gap-2">
            <IconPalette className="h-4 w-4" />
            <span>Color</span>
          </div>
        </DropdownMenuSubTrigger>

        <DropdownMenuSubContent className="w-56 py-1">
          <div className="px-3 py-1 text-xs text-muted-foreground font-medium">
            Text color
          </div>
          {textColors.map((c) => (
            <DropdownMenuItem
              key={c.value}
              onClick={() => onChangeColor?.(c.value)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent/70 cursor-pointer"
            >
              <div
                className={cn(
                  "w-4 h-4 flex items-center justify-center rounded",
                  c.value ? `text-${c.value}-600` : "text-foreground",
                )}
              >
                A
              </div>
              <span>{c.name}</span>
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator className="my-1" />

          <div className="px-3 py-1 text-xs text-muted-foreground font-medium">
            Background color
          </div>
          {backgroundColors.map((c) => (
            <DropdownMenuItem
              key={c.value}
              onClick={() => onChangeColor?.(c.value)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent/70 cursor-pointer"
            >
              <div
                className={cn(
                  "w-4 h-4 rounded",
                  c.value
                    ? `bg-${c.value.split("-")[0]}-100`
                    : "border border-border",
                )}
              />
              <span>{c.name}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    </DropdownMenuContent>
  );
}
