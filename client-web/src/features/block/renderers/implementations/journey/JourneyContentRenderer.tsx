import React from "react";
import { JourneyBlock, isJourneyBlock } from "../../../types";
import { useCurrentStep } from "@/features/block/store/contentStore";

interface JourneyContentRendererProps {
  block: JourneyBlock;
}

/**
 * Journey 블록의 콘텐츠 렌더러
 *
 * Journey의 pinnedProblem을 렌더링합니다.
 */
export const JourneyContentRenderer: React.FC<JourneyContentRendererProps> = ({
  block,
}) => {
  const currentStep = useCurrentStep();

  // 타입 가드
  if (!isJourneyBlock(block)) {
    return <div>Invalid journey block</div>;
  }

  // 문제가 없는 경우
  if (!block.properties.pinnedProblem) {
    return null;
  }

  // 문제 설명 텍스트
  const problemDescription = block.properties.pinnedProblem.text || "";

  // 현재 단계의 관련 키워드를 이용해 문제 텍스트에서 해당 부분 강조 표시
  const highlightedProblemText = () => {
    if (
      !problemDescription ||
      !currentStep?.properties.highlightedKeywordsInProblem ||
      currentStep.properties.highlightedKeywordsInProblem.length === 0
    ) {
      return problemDescription;
    }

    let highlightedText = problemDescription;

    // 각 키워드를 강조 표시용 HTML로 교체
    currentStep.properties.highlightedKeywordsInProblem.forEach(
      (keyword: string) => {
        // 정규식에서 특수 문자 이스케이프
        const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(escapedKeyword, "g");
        highlightedText = highlightedText.replace(
          regex,
          `<span class="underline decoration-blue-500 decoration-1">$&</span>`,
        );
      },
    );

    return highlightedText;
  };

  return (
    <div className="w-full">
      <div className="border border-gray-200 bg-white p-4 h-full overflow-auto rounded-xl shadow">
        <div className="text-lg font-semibold mb-4">문제</div>
        <div
          className="whitespace-pre-wrap text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: highlightedProblemText() }}
        />

        {/* 문제에 해당하는 이미지 추가 */}
        {block.properties.pinnedProblem.media && (
          <div className="mt-4">
            <figure>
              <img
                src={block.properties.pinnedProblem.media.url}
                alt={block.properties.pinnedProblem.media.alt || "문제 이미지"}
                className="max-w-full rounded-md mt-2"
              />
              {block.properties.pinnedProblem.media.caption && (
                <figcaption className="mt-2 text-xs text-gray-500 text-center">
                  {block.properties.pinnedProblem.media.caption}
                </figcaption>
              )}
            </figure>
          </div>
        )}
      </div>
    </div>
  );
};
