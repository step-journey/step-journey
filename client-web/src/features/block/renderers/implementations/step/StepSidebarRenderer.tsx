import React from "react";
import { StepBlock, isStepBlock } from "../../../types";
import {
  useCurrentStepId,
  useHandleStepClick,
} from "@/features/block/store/sidebarStore";
import { useEditingStepTitle } from "@/features/block/store/stepTitleStore";

interface StepSidebarRendererProps {
  block: StepBlock;
}

export const StepSidebarRenderer: React.FC<StepSidebarRendererProps> = ({
  block,
}) => {
  const currentStepId = useCurrentStepId();
  const handleStepClick = useHandleStepClick();

  // Zustand에서 현재 편집 중인 제목 가져오기
  const stepTitle = useEditingStepTitle(
    block.id,
    block.properties.title || "제목 없음",
  );

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
    "flex justify-between items-center px-2 py-1 rounded text-sm cursor-pointer hover:bg-gray-100",
    isActive ? "bg-gray-100 font-medium text-blue-600" : "",
  ].join(" ");

  return (
    <div
      id={`step-${block.id}`}
      className={stepClass}
      onClick={() => handleStepClick(parentId, stepIdInGroup)}
    >
      {/* 기존 getStepTitle(block) 대신 Zustand에서 가져온 제목 사용 */}
      <span>{stepTitle}</span>
    </div>
  );
};
