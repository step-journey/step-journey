import { Button } from "@/components/ui/button";
import {
  IconMap2,
  IconMoonStars,
  IconSun,
  IconPencil,
  IconInfoCircle,
} from "@tabler/icons-react";
import { ReactNode } from "react";

interface Props {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenMap: () => void;
  onNavigateAbout: () => void;
  isEditMode?: boolean;
  onEditClick?: () => void;
  renderAdditionalButtons?: () => ReactNode;
}

export function JourneyHeader({
  isDarkMode,
  onToggleDarkMode,
  onOpenMap,
  onNavigateAbout,
  isEditMode = false,
  onEditClick,
  renderAdditionalButtons,
}: Props) {
  return (
    <header className="h-14 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-zinc-900 px-4 flex items-center justify-between">
      <div className="flex items-center gap-1"></div>

      <div className="flex items-center gap-2">
        {renderAdditionalButtons && renderAdditionalButtons()}

        {!isEditMode && onEditClick && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onEditClick}
            className="text-gray-500 dark:text-gray-400"
          >
            <IconPencil size={18} className="mr-1" />
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenMap}
          className="text-gray-500 dark:text-gray-400"
          title="Journey Map (M)"
        >
          <IconMap2 size={20} />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleDarkMode}
          className="text-gray-500 dark:text-gray-400"
        >
          {isDarkMode ? <IconSun size={20} /> : <IconMoonStars size={20} />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onNavigateAbout}
          className="text-gray-500 dark:text-gray-400"
        >
          <IconInfoCircle size={20} />
        </Button>
      </div>
    </header>
  );
}
