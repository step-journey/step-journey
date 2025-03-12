import { Button } from "@/components/ui/button";
import { IconPencil } from "@tabler/icons-react";
import { ReactNode } from "react";

interface Props {
  isEditMode?: boolean;
  onEditClick?: () => void;
  renderAdditionalButtons?: () => ReactNode;
}

export function JourneyHeader({
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
      </div>
    </header>
  );
}
