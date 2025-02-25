import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { FlattenedStep, GroupData } from "@/types/journey";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentStep: FlattenedStep;
  groupData: GroupData[]; // Phase들
}

export function JourneyMapModal({
  isOpen,
  onClose,
  currentStep,
  groupData,
}: Props) {
  // 단계 총 개수 계산
  const totalSteps = groupData.reduce((sum, g) => sum + g.steps.length, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[600px]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>지도</DialogTitle>
        </DialogHeader>
        <p className="mb-2 text-sm">
          현재 단계: <b>{currentStep.label}</b> ({currentStep.globalIndex + 1} /{" "}
          {totalSteps})
        </p>

        <div className="flex flex-wrap gap-3 rounded border border-gray-200 p-3">
          {groupData.map((grp) => {
            const isCurrentGroup = grp.groupId === currentStep.groupId;

            return (
              <Tooltip key={grp.groupId} delayDuration={0}>
                <TooltipTrigger>
                  <div
                    className={
                      "cursor-pointer border border-gray-200 rounded px-2 py-1 min-w-[120px]" +
                      (isCurrentGroup
                        ? " bg-blue-50"
                        : " bg-white text-gray-700")
                    }
                  >
                    <p className="text-sm font-bold">{grp.groupLabel}</p>
                    <p className="text-xs text-gray-400">
                      (Step count: {grp.steps.length})
                    </p>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs whitespace-pre-wrap">
                    {grp.mapDescription /* Phase에 대한 추가 설명 */}
                  </p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        <div className="mt-4 text-right">
          <Button variant="outline" size="sm" onClick={onClose}>
            닫기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
