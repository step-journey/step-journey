import React, { useEffect, useRef, useState } from "react";
import { BlockType } from "@/types/block";
import {
  IconHeading,
  IconLetterT,
  IconList,
  IconListNumbers,
  IconCheck,
  IconChevronRight,
  IconMessageCircle,
  IconQuote,
  IconSeparator,
  IconCode,
  IconPhoto,
  IconLink,
  IconSearch,
} from "@tabler/icons-react";

interface CommandMenuProps {
  onSelect: (type: BlockType) => void;
  onClose: () => void;
  searchTerm: string;
  position: { top: number; left: number } | null;
}

interface CommandItem {
  type: BlockType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

export default function CommandMenu({
  onSelect,
  onClose,
  searchTerm,
  position,
}: CommandMenuProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const [filteredCommands, setFilteredCommands] = useState<CommandItem[]>([]);

  const commands: CommandItem[] = [
    {
      type: "text",
      label: "Text",
      icon: <IconLetterT />,
      description: "Just start writing with plain text.",
    },
    {
      type: "heading_1",
      label: "Heading 1",
      icon: <IconHeading />,
      description: "Big section heading.",
    },
    {
      type: "heading_2",
      label: "Heading 2",
      icon: <IconHeading className="h-4 w-4" />,
      description: "Medium section heading.",
    },
    {
      type: "heading_3",
      label: "Heading 3",
      icon: <IconHeading className="h-3 w-3" />,
      description: "Small section heading.",
    },
    {
      type: "bulleted_list",
      label: "Bulleted List",
      icon: <IconList />,
      description: "Create a simple bulleted list.",
    },
    {
      type: "numbered_list",
      label: "Numbered List",
      icon: <IconListNumbers />,
      description: "Create a list with numbering.",
    },
    {
      type: "to_do",
      label: "To-do List",
      icon: <IconCheck />,
      description: "Track tasks with a to-do list.",
    },
    {
      type: "toggle",
      label: "Toggle List",
      icon: <IconChevronRight />,
      description: "Toggles can hide and show content.",
    },
    {
      type: "callout",
      label: "Callout",
      icon: <IconMessageCircle />,
      description: "Make your text stand out.",
    },
    {
      type: "quote",
      label: "Quote",
      icon: <IconQuote />,
      description: "Capture a quote.",
    },
    {
      type: "divider",
      label: "Divider",
      icon: <IconSeparator />,
      description: "Visually divide blocks.",
    },
    {
      type: "code",
      label: "Code",
      icon: <IconCode />,
      description: "Capture a code snippet.",
    },
    {
      type: "image",
      label: "Image",
      icon: <IconPhoto />,
      description: "Upload or embed an image.",
    },
    {
      type: "bookmark",
      label: "Bookmark",
      icon: <IconLink />,
      description: "Save a link as a visual bookmark.",
    },
  ];

  useEffect(() => {
    // Filter commands based on search term
    if (searchTerm && searchTerm.length > 0) {
      const filtered = commands.filter((command) =>
        command.label.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setFilteredCommands(filtered);
      setActiveIndex(0); // Reset selection when filtering
    } else {
      setFilteredCommands(commands);
    }
  }, [commands, searchTerm]);

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
            onSelect(filteredCommands[activeIndex].type);
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
      className="absolute z-50 bg-background border border-border rounded-md shadow-lg w-72 max-h-96 overflow-y-auto"
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
          filteredCommands.map((command, index) => (
            <div
              key={command.type}
              className={`flex items-start p-2 gap-3 cursor-pointer hover:bg-accent/60 ${
                index === activeIndex ? "bg-accent" : ""
              }`}
              onClick={() => onSelect(command.type)}
              onMouseEnter={() => setActiveIndex(index)}
            >
              <div className="flex items-center justify-center w-8 h-8 bg-muted rounded text-foreground">
                {command.icon}
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-sm">{command.label}</span>
                <span className="text-xs text-muted-foreground">
                  {command.description}
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
