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
  const [, setLastSaved] = useState<Date | null>(null);

  // 타입 가드
  if (!isStepBlock(block)) {
    return <div>Invalid step block</div>;
  }

  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-screen-2xl px-4 sm:px-6 md:px-8">
        <BlockEditor
          key={`${journeyId}-${block.id}`}
          block={block}
          onLastSavedChange={setLastSaved}
        />
      </div>
    </div>
  );
};
