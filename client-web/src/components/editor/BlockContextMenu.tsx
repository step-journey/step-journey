import { useState, useRef } from "react";
import { BlockType } from "@/types/block";
import { IconTransform, IconPalette } from "@tabler/icons-react";
import {
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
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
 * BlockContextMenu - Notion-style hover menu with submenu
 *
 * This component renders a dropdown menu with hover-triggered submenus.
 * Simply moving the mouse over "Turn into" or "Color" options will
 * automatically open the respective submenu to the right.
 *
 * @param {BlockContextMenuProps} props - The component props
 * @returns {JSX.Element} The rendered dropdown menu content
 */
export default function BlockContextMenu({
  onTurnInto,
  onChangeColor,
}: BlockContextMenuProps) {
  // 현재 활성화된 서브메뉴 상태
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);

  // 메뉴 영역 참조
  const menuRef = useRef<HTMLDivElement>(null);
  const typeSubmenuRef = useRef<HTMLDivElement>(null);
  const colorSubmenuRef = useRef<HTMLDivElement>(null);

  // 서브메뉴 타이머 참조 (debounce 처리용)
  const submenuTimerRef = useRef<number | null>(null);

  // 마우스가 메뉴 항목 위로 이동했을 때
  const handleMenuItemHover = (menuType: string) => {
    // 기존 타이머 취소
    if (submenuTimerRef.current !== null) {
      window.clearTimeout(submenuTimerRef.current);
      submenuTimerRef.current = null;
    }

    // 새 서브메뉴 활성화
    setActiveSubmenu(menuType);
  };

  // 마우스가 메뉴 항목에서 벗어났을 때
  const handleMenuItemLeave = () => {
    // 지연 시간 후 서브메뉴 닫기 (사용자가 서브메뉴로 이동할 시간 확보)
    submenuTimerRef.current = window.setTimeout(() => {
      // 마우스가 서브메뉴에 있는지 확인
      if (!isMouseInSubmenu()) {
        setActiveSubmenu(null);
      }
    }, 100);
  };

  // 마우스가 서브메뉴 영역에 있는지 확인
  const isMouseInSubmenu = () => {
    if (activeSubmenu === "turnInto" && typeSubmenuRef.current) {
      return typeSubmenuRef.current.matches(":hover");
    } else if (activeSubmenu === "color" && colorSubmenuRef.current) {
      return colorSubmenuRef.current.matches(":hover");
    }
    return false;
  };

  // 서브메뉴 마우스 이벤트 핸들러
  const handleSubmenuEnter = () => {
    if (submenuTimerRef.current !== null) {
      window.clearTimeout(submenuTimerRef.current);
      submenuTimerRef.current = null;
    }
  };

  const handleSubmenuLeave = () => {
    submenuTimerRef.current = window.setTimeout(() => {
      setActiveSubmenu(null);
    }, 100);
  };

  // Available colors for text and background
  const colors = [
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
    <DropdownMenuContent
      align="start"
      className="block-context-menu w-48 py-1"
      ref={menuRef}
    >
      {/* Turn into menu item */}
      <div
        className="flex items-center justify-between w-full px-3 py-1.5 text-sm hover:bg-accent/70 cursor-default"
        onMouseEnter={() => handleMenuItemHover("turnInto")}
        onMouseLeave={handleMenuItemLeave}
      >
        <div className="flex items-center gap-2">
          <IconTransform className="h-4 w-4" />
          <span>Turn into</span>
        </div>
        <span>▶</span>
      </div>

      {/* Turn into submenu */}
      {activeSubmenu === "turnInto" && (
        <div
          className="absolute left-full top-0 bg-popover border border-border rounded-md shadow-md w-48 py-1 z-50"
          ref={typeSubmenuRef}
          onMouseEnter={handleSubmenuEnter}
          onMouseLeave={handleSubmenuLeave}
        >
          {COMMON_BLOCK_TYPES.map((type) => (
            <DropdownMenuItem
              key={type}
              onClick={() => onTurnInto && onTurnInto(type)}
              className="gap-2"
            >
              <span>{BLOCK_ICONS[type]}</span>
              <span>{BLOCK_LABELS[type]}</span>
              {type === "text" && <span className="ml-auto">✓</span>}
            </DropdownMenuItem>
          ))}
        </div>
      )}

      {/* Color menu item */}
      <div
        className="flex items-center justify-between w-full px-3 py-1.5 text-sm hover:bg-accent/70 cursor-default"
        onMouseEnter={() => handleMenuItemHover("color")}
        onMouseLeave={handleMenuItemLeave}
      >
        <div className="flex items-center gap-2">
          <IconPalette className="h-4 w-4" />
          <span>Color</span>
        </div>
        <span>▶</span>
      </div>

      {/* Color submenu */}
      {activeSubmenu === "color" && (
        <div
          className="absolute left-full top-[32px] bg-popover border border-border rounded-md shadow-md w-48 py-1 z-50"
          ref={colorSubmenuRef}
          onMouseEnter={handleSubmenuEnter}
          onMouseLeave={handleSubmenuLeave}
        >
          {/* Text color section */}
          <div className="px-3 py-1 text-xs text-muted-foreground font-medium">
            Text color
          </div>
          {colors.map((color) => (
            <div
              key={color.value}
              onClick={() => onChangeColor && onChangeColor(color.value)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent/70 cursor-default"
            >
              <div
                className={cn(
                  "w-4 h-4 flex items-center justify-center rounded",
                  color.value ? `text-${color.value}-600` : "text-foreground",
                )}
              >
                <span className="font-bold">A</span>
              </div>
              <span>{color.name}</span>
            </div>
          ))}

          {/* Background color section */}
          <div className="mt-2 px-3 py-1 text-xs text-muted-foreground font-medium">
            Background color
          </div>
          {backgroundColors.map((color) => (
            <div
              key={color.value}
              onClick={() => onChangeColor && onChangeColor(color.value)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent/70 cursor-default"
            >
              <div
                className={cn(
                  "w-4 h-4 rounded",
                  color.value
                    ? `bg-${color.value.split("-")[0]}-100`
                    : "border border-border",
                )}
              />
              <span>{color.name}</span>
            </div>
          ))}
        </div>
      )}
    </DropdownMenuContent>
  );
}
