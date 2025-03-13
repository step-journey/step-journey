import { Button } from "@/components/ui/button";
import { IconPencil, IconCheck } from "@tabler/icons-react";
import { ReactNode } from "react";
import {
  useIsEditMode,
  useToggleEditMode,
} from "@/features/block/store/editorStore";

interface Props {
  renderAdditionalButtons?: () => ReactNode;
}

export function JourneyHeader({ renderAdditionalButtons }: Props) {
  const isEditMode = useIsEditMode();
  const toggleEditMode = useToggleEditMode();

  return (
    <header className="h-14 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-zinc-900 px-4 flex items-center justify-between">
      <div className="flex items-center gap-1"></div>

      <div className="flex items-center gap-2">
        {renderAdditionalButtons && renderAdditionalButtons()}
        <Button
          variant={isEditMode ? "default" : "ghost"}
          size="sm"
          className={isEditMode ? "" : "text-gray-500 dark:text-gray-400"}
          onClick={toggleEditMode}
        >
          {isEditMode ? (
            <>
              <IconCheck size={18} className="mr-1" />
              편집 완료
            </>
          ) : (
            <>
              <IconPencil size={18} className="mr-1" />
              편집
            </>
          )}
        </Button>
      </div>
    </header>
  );
}
