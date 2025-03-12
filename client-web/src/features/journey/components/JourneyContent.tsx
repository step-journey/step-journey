import "@blocknote/core/fonts/inter.css";
import { Block, JourneyBlock, isJourneyBlock } from "@/features/block/types";
import {
  BlockRenderer,
  RenderingArea,
  useContentContext,
} from "@/features/block/renderers";
import { getAccumulatedContent } from "@/features/block/utils/renderUtils";

interface Props {
  journeyBlock: Block;
}

export function JourneyContent({ journeyBlock }: Props) {
  const { currentStep, allSteps } = useContentContext();

  // 타입 가드로 안전하게 사용
  if (!isJourneyBlock(journeyBlock)) {
    return <div>Invalid journey block</div>;
  }

  const typedJourneyBlock = journeyBlock as JourneyBlock;

  // 문제 설명이 있는지 확인 (Journey 블록에만 있음)
  const hasPinnedProblem = !!typedJourneyBlock.properties.pinnedProblem;

  // 현재 단계의 내용 누적 계산
  const accumulatedContent = getAccumulatedContent(currentStep, allSteps);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-6">
      {/* 좌우 2열 레이아웃 (강제) */}
      <div className="flex flex-row gap-6 h-full">
        {/* 좌측: 문제가 항상 표시되는 영역 */}
        {hasPinnedProblem && (
          <div className="w-1/3 shrink-0">
            <BlockRenderer
              block={typedJourneyBlock}
              area={RenderingArea.CONTENT}
            />
          </div>
        )}

        {/* 우측: 현재 단계의 내용이 표시되는 영역 */}
        <div className={hasPinnedProblem ? "w-2/3" : "w-full"}>
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
                <div className="math-content">
                  {/* 누적된 내용 표시 */}
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
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
