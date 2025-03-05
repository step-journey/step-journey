import { useEffect, useRef, useState } from "react";
import { BlockType } from "@/types/block";
import { IconSearch } from "@tabler/icons-react";
import {
  BLOCK_ICONS,
  BLOCK_LABELS,
  BLOCK_DESCRIPTIONS,
} from "./blocks/BlockTypes";
import { cn } from "@/lib/utils";

interface CommandMenuProps {
  onSelect: (type: BlockType) => void;
  onClose: () => void;
  searchTerm: string;
  position: { top: number; left: number } | null;
}

export default function SlashCommandMenu({
  onSelect,
  onClose,
  searchTerm,
  position,
}: CommandMenuProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const [filteredCommands, setFilteredCommands] = useState<BlockType[]>([]);

  // BLOCK_LABELS, BLOCK_DESCRIPTIONS, BLOCK_ICONS를 활용하여 명령어 목록 생성
  const blockTypes = Object.keys(BLOCK_LABELS) as BlockType[];

  useEffect(() => {
    // Filter commands based on search term
    if (searchTerm && searchTerm.length > 0) {
      const filtered = blockTypes.filter((type) =>
        BLOCK_LABELS[type].toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setFilteredCommands(filtered);
      setActiveIndex(0); // Reset selection when filtering
    } else {
      setFilteredCommands(blockTypes);
    }
  }, [searchTerm]);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!position) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((prev) =>
            prev < filteredCommands.length - 1 ? prev + 1 : prev,
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((prev) => (prev > 0 ? prev - 1 : 0));
          break;
        case "Enter":
          e.preventDefault();
          if (filteredCommands[activeIndex]) {
            onSelect(filteredCommands[activeIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeIndex, filteredCommands, onClose, onSelect, position]);

  // If no position is provided, don't render
  if (!position) return null;

  return (
    <div
      ref={menuRef}
      className={cn(
        "slash-command-menu absolute z-50 bg-background border border-border rounded-md shadow-lg w-72 max-h-96 overflow-y-auto",
      )}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: "translate(0, 8px)",
      }}
    >
      <div className="p-2 border-b border-border">
        <div className="flex items-center gap-2 text-muted-foreground">
          <IconSearch className="h-4 w-4" />
          <span className="text-sm">
            {searchTerm ? `Find: ${searchTerm}` : "Find blocks..."}
          </span>
        </div>
      </div>
      <div className="py-1">
        {filteredCommands.length > 0 ? (
          filteredCommands.map((type, index) => (
            <div
              key={type}
              className={`flex items-start p-2 gap-3 cursor-pointer hover:bg-accent/60 ${
                index === activeIndex ? "bg-accent" : ""
              }`}
              onClick={() => onSelect(type)}
              onMouseEnter={() => setActiveIndex(index)}
            >
              <div className="flex items-center justify-center w-8 h-8 bg-muted rounded text-foreground">
                {BLOCK_ICONS[type]}
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-sm">
                  {BLOCK_LABELS[type]}
                </span>
                <span className="text-xs text-muted-foreground">
                  {BLOCK_DESCRIPTIONS[type]}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            No results found
          </div>
        )}
      </div>
    </div>
  );
}
