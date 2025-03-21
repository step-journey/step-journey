import {
  useIsEditMode,
  useToggleEditMode,
} from "@/features/block/store/editorStore";
import { Button } from "@/components/ui/button";
import { IconEye, IconEdit, IconInfoCircle } from "@tabler/icons-react";

export function JourneyHeader() {
  const isEditMode = useIsEditMode();
  const toggleEditMode = useToggleEditMode();

  return (
    <header className="h-14 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-zinc-900 px-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {/* 좌측 영역에 아이콘+텍스트 버튼 배치 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleEditMode}
          className="text-gray-500 dark:text-gray-400"
        >
          {isEditMode ? (
            <>
              <IconEye size={18} className="mr-1" />뷰 모드로 전환
            </>
          ) : (
            <>
              <IconEdit size={18} className="mr-1" />
              편집 모드로 전환
            </>
          )}
        </Button>
      </div>

      <div className="flex items-center gap-2">
        {/* 정보 아이콘 - 우측에 배치 */}
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-500 dark:text-gray-400"
        >
          <IconInfoCircle size={20} />
        </Button>
      </div>
    </header>
  );
}
