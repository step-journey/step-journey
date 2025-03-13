import { Block, isJourneyBlock, isStepBlock } from "@/features/block/types";
import { useCurrentStep } from "@/features/block/store/contentStore";
import { BlockEditor } from "@/features/block/components/BlockEditor";
import { useIsEditMode } from "@/features/block/store/editorStore";

interface Props {
  journeyBlock: Block;
}

export function JourneyContent({ journeyBlock }: Props) {
  const currentStep = useCurrentStep();
  const isEditMode = useIsEditMode();

  // 타입 가드로 안전하게 사용
  if (!isJourneyBlock(journeyBlock)) {
    return <div>Invalid journey block</div>;
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-6">
      <div className="h-full">
        <div className="w-full">
          {currentStep && (
            <>
              {/* 제목 영역 */}
              <p className="mb-1 text-lg font-semibold">
                {currentStep.properties.title}
              </p>

              <div className="border border-gray-200 bg-white p-4 rounded-xl shadow">
                {/* 에디트 모드일 때는 BlockEditor 컴포넌트 사용 */}
                {isEditMode && isStepBlock(currentStep) ? (
                  <BlockEditor block={currentStep} />
                ) : (
                  <div className="math-content">
                    <div className="relative">
                      <div className="flex">
                        {/* 왼쪽 여백 및 표시선 */}
                        <div className="relative flex-shrink-0 w-3">
                          <div className="absolute left-0 top-0 h-full w-0.5 bg-blue-500"></div>
                        </div>

                        {/* 내용 */}
                        <div
                          dangerouslySetInnerHTML={{
                            __html: `<p>${currentStep.properties.content?.join("\n") || ""}</p>`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
