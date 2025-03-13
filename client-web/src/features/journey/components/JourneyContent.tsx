import { Block, isJourneyBlock, isStepBlock } from "@/features/block/types";
import { getAccumulatedContent } from "@/features/block/utils/renderUtils";
import {
  useCurrentStep,
  useAllSteps,
} from "@/features/block/store/contentStore";
import { BlockEditor } from "@/features/block/components/BlockEditor";
import { useIsEditMode } from "@/features/block/store/editorStore";

interface Props {
  journeyBlock: Block;
}

export function JourneyContent({ journeyBlock }: Props) {
  const currentStep = useCurrentStep();
  const allSteps = useAllSteps();
  const isEditMode = useIsEditMode();

  // 타입 가드로 안전하게 사용
  if (!isJourneyBlock(journeyBlock)) {
    return <div>Invalid journey block</div>;
  }

  // 현재 단계의 내용 누적 계산
  const accumulatedContent = getAccumulatedContent(currentStep, allSteps);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-6">
      {/* Single column layout now that pinnedProblem is removed */}
      <div className="h-full">
        {/* 현재 단계의 내용이 표시되는 영역 */}
        <div className="w-full">
          {currentStep && (
            <>
              {/* 제목 영역 */}
              <>
                <p className="mb-1 text-lg font-semibold">
                  {currentStep.properties.label}
                </p>
                <p className="mb-4 text-sm text-gray-500">
                  {currentStep.properties.desc}
                </p>
              </>

              <div className="border border-gray-200 bg-white p-4 rounded-xl shadow">
                {/* 에디트 모드일 때는 BlockEditor 컴포넌트 사용 */}
                {isEditMode && isStepBlock(currentStep) ? (
                  <BlockEditor block={currentStep} />
                ) : (
                  // 일반 모드: 누적된 내용 표시
                  <div className="math-content">
                    {accumulatedContent.map((item, index) => (
                      <div
                        key={item.step.globalIndex}
                        className={`${index > 0 ? "mt-3 pt-2" : ""} relative`}
                      >
                        <div className="flex">
                          {/* 현재 step 내용에는 세로선 추가 */}
                          <div className="relative flex-shrink-0 w-3">
                            {item.isCurrentStep && (
                              <div className="absolute left-0 top-0 h-full w-0.5 bg-blue-500"></div>
                            )}
                          </div>

                          {/* 내용 */}
                          <div
                            dangerouslySetInnerHTML={{
                              __html: `<p>${item.content}</p>`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
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
