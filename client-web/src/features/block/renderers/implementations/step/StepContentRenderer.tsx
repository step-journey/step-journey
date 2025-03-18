import React from "react";
import { StepBlock, isStepBlock } from "../../../types";
import { EditableStepTitle } from "../../../components/EditableStepTitle";
import { BlockEditor } from "../../../components/BlockEditor";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/queryKeys";

interface StepContentRendererProps {
  block: StepBlock;
  journeyId: string; // 상위 Journey ID 추가
}

/**
 * Step 블록의 콘텐츠 렌더러
 */
export const StepContentRenderer: React.FC<StepContentRendererProps> = ({
  block,
  journeyId,
}) => {
  const queryClient = useQueryClient();

  // 타입 가드
  if (!isStepBlock(block)) {
    return <div>Invalid step block</div>;
  }

  // 제목 업데이트 후 쿼리 무효화
  const handleTitleBlur = async () => {
    try {
      // 쿼리 캐시 무효화 (UI 업데이트 위함)
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.journeys.detail(journeyId),
      });
    } catch (error) {
      console.error("Failed to invalidate queries:", error);
    }
  };

  return (
    <div className="w-full">
      <EditableStepTitle
        stepId={block.id}
        value={block.properties.title || ""}
        onBlur={handleTitleBlur}
        className="mb-3 text-2xl font-bold"
        placeholder="제목 없음"
      />

      <BlockEditor key={`${journeyId}-${block.id}`} block={block} />
    </div>
  );
};
