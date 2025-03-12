import "@blocknote/core/fonts/inter.css";
import { FlattenedStep, Journey, PinnedProblem } from "@/types/journey";
import { mathMarkdownToHtml } from "@/utils/mathMarkdown";

interface Props {
  currentStep: FlattenedStep;
  allSteps: FlattenedStep[];
  journey: Journey;
}

export function JourneyContent({ currentStep, allSteps, journey }: Props) {
  // 콘텐츠가 있는지 여부 확인
  const hasContent = !!currentStep.content;

  // 문제 설명이 있는지 확인
  const hasPinnedProblem = !!journey.pinnedProblem;

  // pinnedProblem 객체화
  let pinnedProblem: PinnedProblem | null = null;
  if (hasPinnedProblem) {
    if (typeof journey.pinnedProblem === "string") {
      pinnedProblem = { text: journey.pinnedProblem };
    } else {
      pinnedProblem = journey.pinnedProblem as PinnedProblem;
    }
  }

  // 문제 설명 텍스트
  const problemDescription = pinnedProblem ? pinnedProblem.text : "";

  // 현재 단계의 관련 키워드를 이용해 문제 텍스트에서 해당 부분 강조 표시
  const highlightedProblemText = () => {
    if (
      !problemDescription ||
      !currentStep.highlightedKeywordsInProblem ||
      currentStep.highlightedKeywordsInProblem.length === 0
    ) {
      return problemDescription;
    }

    let highlightedText = problemDescription;

    // 각 키워드를 강조 표시용 HTML로 교체
    currentStep.highlightedKeywordsInProblem.forEach((keyword) => {
      // 정규식에서 특수 문자 이스케이프
      const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escapedKeyword, "g");
      highlightedText = highlightedText.replace(
        regex,
        `<span class="underline decoration-blue-500 decoration-1">$&</span>`,
      );
    });

    return highlightedText;
  };

  // 현재 단계까지의 모든 내용을 누적하여 표시
  const accumulatedContent = hasContent
    ? allSteps
        .filter(
          (step) => step.globalIndex <= currentStep.globalIndex && step.content,
        )
        .map((step) => {
          const isCurrentStep = step.globalIndex === currentStep.globalIndex;
          const content = Array.isArray(step.content)
            ? step.content.join("\n")
            : step.content || "";

          // 현재 단계의 내용을 강조표시
          return {
            step,
            content,
            isCurrentStep,
          };
        })
    : [];

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-6">
      {/* 좌우 2열 레이아웃 (강제) */}
      <div className="flex flex-row gap-6 h-full">
        {/* 좌측: 문제가 항상 표시되는 영역 */}
        {hasPinnedProblem && pinnedProblem && (
          <div className="w-1/3 shrink-0">
            <div className="border border-gray-200 bg-white p-4 h-full overflow-auto rounded-xl shadow">
              <div className="text-lg font-semibold mb-4">문제</div>
              <div
                className="whitespace-pre-wrap text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: highlightedProblemText() }}
              />

              {/* 문제에 해당하는 이미지 추가 */}
              {pinnedProblem.media && (
                <div className="mt-4">
                  <figure>
                    <img
                      src={pinnedProblem.media.url}
                      alt={pinnedProblem.media.alt || "문제 이미지"}
                      className="max-w-full rounded-md mt-2"
                    />
                    {pinnedProblem.media.caption && (
                      <figcaption className="mt-2 text-xs text-gray-500 text-center">
                        {pinnedProblem.media.caption}
                      </figcaption>
                    )}
                  </figure>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 우측: 현재 단계의 내용이 표시되는 영역 */}
        <div className={hasPinnedProblem ? "w-2/3" : "w-full"}>
          {/* 제목 영역 */}
          <>
            <p className="mb-1 text-lg font-semibold">{currentStep.label}</p>
            <p className="mb-4 text-sm text-gray-500">{currentStep.desc}</p>
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
                        __html: `<p>${mathMarkdownToHtml(item.content)}</p>`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
