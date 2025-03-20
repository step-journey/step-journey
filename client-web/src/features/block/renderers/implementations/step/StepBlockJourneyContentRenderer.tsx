import React, { useState } from "react";
import { StepBlock, isStepBlock } from "../../../types";
import { BlockEditor } from "../../../components/BlockEditor";

interface StepBlockContentRendererProps {
  block: StepBlock;
  journeyId: string;
}

/**
 * Step 블록의 콘텐츠 렌더러
 */
export const StepBlockJourneyContentRenderer: React.FC<
  StepBlockContentRendererProps
> = ({ block, journeyId }) => {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // 타입 가드
  if (!isStepBlock(block)) {
    return <div>Invalid step block</div>;
  }

  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-6xl px-4 sm:px-6 md:px-8">
        <div className="flex justify-end mb-1">
          <span className="text-xs text-gray-400">
            {lastSaved
              ? `${lastSaved.toLocaleTimeString()}에 저장됨`
              : "편집시 자동 저장"}
          </span>
        </div>

        <BlockEditor
          key={`${journeyId}-${block.id}`}
          block={block}
          onLastSavedChange={setLastSaved}
        />
      </div>
    </div>
  );
};
