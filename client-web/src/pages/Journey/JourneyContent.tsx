import { Card } from "@/components/ui/card";
import { FlattenedStep, Journey, PinnedProblem } from "@/types/journey";
import { Separator } from "@/components/ui/separator";
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
      !currentStep.relatedKeywords ||
      currentStep.relatedKeywords.length === 0
    ) {
      return problemDescription;
    }

    let highlightedText = problemDescription;

    // 각 키워드를 강조 표시용 HTML로 교체
    currentStep.relatedKeywords.forEach((keyword) => {
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
            <Card className="border border-gray-200 bg-white p-4 h-full overflow-auto">
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
            </Card>
          </div>
        )}

        {/* 우측: 현재 단계의 내용이 표시되는 영역 */}
        <div className={hasPinnedProblem ? "w-2/3" : "w-full"}>
          <p className="mb-1 text-lg font-semibold">{currentStep.label}</p>
          <p className="mb-4 text-sm text-gray-500">{currentStep.desc}</p>

          <Card className="border border-gray-200 bg-white p-4">
            {hasContent ? (
              /* 누적된 내용 표시 */
              <div className="math-content">
                {accumulatedContent.map((item, index) => (
                  <div
                    key={item.step.globalIndex}
                    className={`${index > 0 ? "mt-3 pt-2" : ""}`}
                  >
                    <div
                      className={`${
                        item.isCurrentStep ? "bg-blue-50 p-3 rounded" : ""
                      }`}
                      dangerouslySetInnerHTML={{
                        __html: `<p>${mathMarkdownToHtml(item.content)}</p>`,
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              /* 기존 예시 내용 표시 */
              <>
                <p className="mb-2 text-sm font-medium">
                  여기에 해당 단계 내용
                </p>
                <ul className="list-inside list-disc text-sm text-gray-600">
                  <li>코드 스니펫, 서버로그, API 응답 등</li>
                  <li>직접 조작 예시</li>
                </ul>
              </>
            )}

            {/* 예시 내용이 있는 경우 표시 */}
            {currentStep.example && (
              <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Example:</p>
                <code className="text-sm">{currentStep.example}</code>
              </div>
            )}

            {/* 미디어가 있는 경우 표시 */}
            {currentStep.media && (
              <div className="mt-4">
                <Separator className="my-4" />
                <figure>
                  <img
                    src={currentStep.media.url}
                    alt={currentStep.media.alt || "단계 이미지"}
                    className="max-w-full rounded-md"
                  />
                  {currentStep.media.caption && (
                    <figcaption className="mt-2 text-sm text-gray-500 text-center">
                      {currentStep.media.caption}
                    </figcaption>
                  )}
                </figure>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
