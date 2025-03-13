import React from "react";
import { StepBlock, isStepBlock, getStepLabel } from "../../../types";
import {
  useCurrentStepId,
  useHandleStepClick,
} from "@/features/block/store/sidebarStore";

interface StepSidebarRendererProps {
  block: StepBlock;
}

/**
 * Step 블록의 사이드바 렌더러
 */
export const StepSidebarRenderer: React.FC<StepSidebarRendererProps> = ({
  block,
}) => {
  const currentStepId = useCurrentStepId();
  const handleStepClick = useHandleStepClick();

  // 타입 가드
  if (!isStepBlock(block)) {
    return <div>Invalid step block</div>;
  }

  // 현재 선택된 스텝인지 확인
  const isActive = currentStepId === block.id;
  const stepIdInGroup = block.properties.stepIdInGroup || 0;
  const parentId = block.parentId || "";

  // 스타일 클래스 구성
  const stepClass = [
    "px-2 py-1 rounded text-sm cursor-pointer hover:bg-gray-100",
    isActive ? "bg-gray-100 font-medium text-blue-600" : "",
  ].join(" ");

  return (
    <div
      id={`step-${block.id}`}
      className={stepClass}
      onClick={() => handleStepClick(parentId, stepIdInGroup)}
    >
      {getStepLabel(block)}
    </div>
  );
};
