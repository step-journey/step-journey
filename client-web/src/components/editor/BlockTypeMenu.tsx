import React, { useRef, useEffect } from "react";
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
} from "@tabler/icons-react";

interface BlockTypeMenuProps {
  onSelect: (type: BlockType) => void;
  onClose: () => void;
}

export default function BlockTypeMenu({
  onSelect,
  onClose,
}: BlockTypeMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

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

  const blockTypes: {
    type: BlockType;
    label: string;
    icon: React.ReactNode;
  }[] = [
    { type: "text", label: "Text", icon: <IconLetterT /> },
    { type: "heading_1", label: "Heading 1", icon: <IconHeading /> },
    {
      type: "heading_2",
      label: "Heading 2",
      icon: <IconHeading className="h-4 w-4" />,
    },
    {
      type: "heading_3",
      label: "Heading 3",
      icon: <IconHeading className="h-3 w-3" />,
    },
    { type: "bulleted_list", label: "Bulleted List", icon: <IconList /> },
    {
      type: "numbered_list",
      label: "Numbered List",
      icon: <IconListNumbers />,
    },
    { type: "to_do", label: "To-do List", icon: <IconCheck /> },
    { type: "toggle", label: "Toggle List", icon: <IconChevronRight /> },
    { type: "callout", label: "Callout", icon: <IconMessageCircle /> },
    { type: "quote", label: "Quote", icon: <IconQuote /> },
    { type: "divider", label: "Divider", icon: <IconSeparator /> },
    { type: "code", label: "Code", icon: <IconCode /> },
    { type: "image", label: "Image", icon: <IconPhoto /> },
    { type: "bookmark", label: "Bookmark", icon: <IconLink /> },
  ];

  return (
    <div
      ref={menuRef}
      className="absolute left-9 top-0 z-50 bg-popover border border-border rounded-md shadow-md w-48"
    >
      <div className="py-1">
        {blockTypes.map((item) => (
          <button
            key={item.type}
            className="flex items-center w-full px-4 py-2 text-sm hover:bg-accent"
            onClick={() => onSelect(item.type)}
          >
            <span className="mr-2">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
