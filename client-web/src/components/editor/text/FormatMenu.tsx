import React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { TextFormat } from "@/types/block";
import {
  IconBold,
  IconItalic,
  IconUnderline,
  IconStrikethrough,
  IconCode,
  IconLink,
  IconHighlight,
} from "@tabler/icons-react";

interface FormatMenuProps {
  isOpen: boolean;
  position: { top: number; left: number } | null;
  activeFormats: TextFormat[];
  onFormatClick: (format: TextFormat) => void;
  onLinkClick: () => void;
}

/**
 * 텍스트 선택 시 나타나는 서식 메뉴 컴포넌트
 */
const FormatMenu: React.FC<FormatMenuProps> = ({
  isOpen,
  position,
  activeFormats,
  onFormatClick,
  onLinkClick,
}) => {
  if (!isOpen || !position) return null;

  const menu = (
    <div
      className={cn(
        "format-menu fixed bg-background border border-border shadow-md rounded-md flex items-center p-1 z-50",
      )}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: "translateX(-50%)",
      }}
    >
      <button
        className={cn(
          "p-1.5 rounded hover:bg-accent/50",
          activeFormats.some((f) => f[0] === "b") && "bg-accent",
        )}
        onClick={() => onFormatClick(["b"])}
        title="굵게 (Ctrl+B)"
      >
        <IconBold className="h-4 w-4" />
      </button>
      <button
        className={cn(
          "p-1.5 rounded hover:bg-accent/50",
          activeFormats.some((f) => f[0] === "i") && "bg-accent",
        )}
        onClick={() => onFormatClick(["i"])}
        title="기울임 (Ctrl+I)"
      >
        <IconItalic className="h-4 w-4" />
      </button>
      <button
        className={cn(
          "p-1.5 rounded hover:bg-accent/50",
          activeFormats.some((f) => f[0] === "u") && "bg-accent",
        )}
        onClick={() => onFormatClick(["u"])}
        title="밑줄 (Ctrl+U)"
      >
        <IconUnderline className="h-4 w-4" />
      </button>
      <button
        className={cn(
          "p-1.5 rounded hover:bg-accent/50",
          activeFormats.some((f) => f[0] === "s") && "bg-accent",
        )}
        onClick={() => onFormatClick(["s"])}
        title="취소선"
      >
        <IconStrikethrough className="h-4 w-4" />
      </button>
      <button
        className={cn(
          "p-1.5 rounded hover:bg-accent/50",
          activeFormats.some((f) => f[0] === "c") && "bg-accent",
        )}
        onClick={() => onFormatClick(["c"])}
        title="코드 (Ctrl+E)"
      >
        <IconCode className="h-4 w-4" />
      </button>
      <button
        className={cn(
          "p-1.5 rounded hover:bg-accent/50",
          activeFormats.some((f) => f[0] === "a") && "bg-accent",
        )}
        onClick={onLinkClick}
        title="링크 (Ctrl+K)"
      >
        <IconLink className="h-4 w-4" />
      </button>
      <button
        className={cn(
          "p-1.5 rounded hover:bg-accent/50",
          activeFormats.some((f) => f[0] === "h") && "bg-accent",
        )}
        onClick={() => onFormatClick(["h", "yellow"])}
        title="형광펜"
      >
        <IconHighlight className="h-4 w-4" />
      </button>
    </div>
  );

  return createPortal(menu, document.body);
};

export default FormatMenu;
