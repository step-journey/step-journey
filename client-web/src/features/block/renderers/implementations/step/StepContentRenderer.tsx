import React from "react";
import { StepBlock, isStepBlock, getStepContent } from "../../../types";
import { useCurrentStep } from "@/features/block/store/contentStore";
import { BlockEditor } from "@/features/block/components/BlockEditor";
import { useIsEditMode } from "@/features/block/store/editorStore";

interface StepContentRendererProps {
  block: StepBlock;
}

export const StepContentRenderer: React.FC<StepContentRendererProps> = ({
  block,
}) => {
  const currentStep = useCurrentStep();
  const isEditMode = useIsEditMode();

  // 타입 가드
  if (!isStepBlock(block)) {
    return <div>Invalid step block</div>;
  }

  // 내용 준비
  const content = getStepContent(block).join("\n");
  const isCurrentStep = currentStep?.id === block.id;

  // 특정 단계만 렌더링 (StepContentRenderer 는 일반적으로 직접 사용되지 않고,
  // JourneyContent 컴포넌트에서 모든 단계를 누적해서 렌더링할 때 사용됨)
  const renderSingleStep = () => {
    if (isEditMode && isCurrentStep) {
      return <BlockEditor block={block} />;
    }

    return (
      <div className="relative">
        <div className="flex">
          <div className="relative flex-shrink-0 w-3">
            {isCurrentStep && (
              <div className="absolute left-0 top-0 h-full w-0.5 bg-blue-500"></div>
            )}
          </div>
          <div
            dangerouslySetInnerHTML={{
              __html: `<p>${content}</p>`,
            }}
          />
        </div>
      </div>
    );
  };

  // 단계 제목과 설명
  const renderStepHeader = () => (
    <>
      <p className="mb-1 text-lg font-semibold">{block.properties.title}</p>
      <p className="mb-4 text-sm text-gray-500">{block.properties.desc}</p>
    </>
  );

  return (
    <div className="w-full">
      {/* 제목 영역 */}
      {renderStepHeader()}

      <div className="border border-gray-200 bg-white p-4 rounded-xl shadow">
        {isEditMode ? (
          <BlockEditor block={block} />
        ) : (
          <div className="math-content">{renderSingleStep()}</div>
        )}
      </div>
    </div>
  );
};
