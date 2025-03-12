import React from "react";
import { StepBlock, isStepBlock, getStepLabel } from "../../../types";
import { useSidebarContext } from "../../contexts/SidebarContext";

interface StepSidebarRendererProps {
  block: StepBlock;
}

/**
 * Step 블록의 사이드바 렌더러
 */
export const StepSidebarRenderer: React.FC<StepSidebarRendererProps> = ({
  block,
}) => {
  const { onClickStep, currentStepId } = useSidebarContext();

  // 타입 가드
  if (!isStepBlock(block)) {
    return <div>Invalid step block</div>;
  }

  const isActive = currentStepId === block.id;
  const stepIdInGroup = block.properties.stepIdInGroup || 0;
  const parentId = block.parentId || "";

  const stepClass = [
    "px-2 py-1 rounded text-sm cursor-pointer hover:bg-gray-100",
    isActive ? "bg-gray-100 font-medium text-blue-600" : "",
  ].join(" ");

  return (
    <div
      id={`step-${block.id}`}
      className={stepClass}
      onClick={() => onClickStep(parentId, stepIdInGroup)}
    >
      {getStepLabel(block)}
    </div>
  );
};
