import { Block, isJourneyBlock, isStepBlock } from "@/features/block/types";
import { useCurrentStep } from "@/features/block/store/contentStore";
import { BlockEditor } from "@/features/block/components/BlockEditor";

interface Props {
  journeyBlock: Block;
}

export function JourneyContent({ journeyBlock }: Props) {
  const currentStep = useCurrentStep();

  // 타입 가드로 안전하게 사용
  if (!isJourneyBlock(journeyBlock)) {
    return <div>Invalid journey block</div>;
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-6">
      <div className="h-full">
        <div className="w-full">
          {currentStep && isStepBlock(currentStep) && (
            <>
              {/* 제목 영역 */}
              <p className="mb-1 text-lg font-semibold">
                {currentStep.properties.title}
              </p>
              {/* key 속성 추가: journey, step 변경될 때 컴포넌트 강제 재생성 */}
              <BlockEditor
                key={`${journeyBlock.id}-${currentStep.id}`}
                block={currentStep}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
