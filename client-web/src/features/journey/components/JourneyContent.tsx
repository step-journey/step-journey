import { Block, isJourneyBlock, isStepBlock } from "@/features/block/types";
import { useCurrentStep } from "@/features/block/store/contentStore";
import { BlockEditor } from "@/features/block/components/BlockEditor";
import { EditableStepTitle } from "@/features/block/components/EditableStepTitle";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/queryKeys";

interface Props {
  journeyBlock: Block;
}

export function JourneyContent({ journeyBlock }: Props) {
  const currentStep = useCurrentStep();
  const queryClient = useQueryClient();
  // 포커스 해제 시 처리 - 쿼리 무효화만 담당
  const handleTitleBlur = async () => {
    if (!currentStep) return;

    try {
      // 쿼리 캐시 무효화 (UI 업데이트 위함)
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.journeys.detail(journeyBlock.id),
      });
    } catch (error) {
      console.error("Failed to invalidate queries:", error);
    }
  };

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-6">
      {!isJourneyBlock(journeyBlock) ? (
        <div>Invalid journey block</div>
      ) : (
        <div className="h-full">
          <div className="w-full">
            {currentStep && isStepBlock(currentStep) && (
              <>
                <EditableStepTitle
                  stepId={currentStep.id}
                  value={currentStep.properties.title || ""}
                  onBlur={handleTitleBlur}
                  className="mb-3 text-2xl font-bold"
                  placeholder="제목 없음"
                />

                <BlockEditor
                  key={`${journeyBlock.id}-${currentStep.id}`}
                  block={currentStep}
                />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
