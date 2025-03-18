import React, { useState } from "react";
import { StepBlock, isStepBlock } from "../../../types";
import {
  useCurrentStepId,
  useHandleStepClick,
} from "@/features/block/store/sidebarStore";
import { useEditingStepTitle } from "@/features/block/store/stepTitleStore";
import { useParams } from "react-router-dom";
import { useJourneyActions } from "@/features/journey/hooks/useJourneyActions";
import { useBlockStore } from "@/features/block/store/blockStore";
import { IconTrash } from "@tabler/icons-react";
import { DeleteStepModal } from "@/features/journey/components/DeleteStepModal";

interface StepSidebarRendererProps {
  block: StepBlock;
}

export const StepSidebarRenderer: React.FC<StepSidebarRendererProps> = ({
  block,
}) => {
  const { journeyId } = useParams<{ journeyId: string }>();
  const currentStepId = useCurrentStepId();
  const handleStepClick = useHandleStepClick();
  const setCurrentStepIndex = useBlockStore(
    (state) => state.setCurrentStepIndex,
  );
  const { deleteStep, isDeletingStep } = useJourneyActions();

  // Local states for hover effect and delete modal
  const [isHovered, setIsHovered] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

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
  const globalIndex = block.properties.globalIndex || 0;
  const parentId = block.parentId || "";

  // Step 삭제 핸들러
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 클릭 이벤트 버블링 방지
    setIsDeleteModalOpen(true);
  };

  // Step 삭제 확인 핸들러
  const handleConfirmDelete = async () => {
    if (!journeyId) return;

    const nextIndex = await deleteStep(journeyId, block.id);

    if (nextIndex !== null) {
      setCurrentStepIndex(nextIndex);
      setIsDeleteModalOpen(false);
    }
  };

  // 스타일 클래스 구성
  const stepClass = [
    "flex justify-between items-center px-2 py-1 rounded text-sm cursor-pointer hover:bg-gray-100 group h-[28px]",
    isActive ? "bg-gray-100 font-medium text-blue-600" : "",
  ].join(" ");

  return (
    <>
      <div
        id={`step-${block.id}`}
        className={stepClass}
        onClick={() => handleStepClick(parentId, globalIndex)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* 스텝 제목 */}
        <span className="truncate flex-1">{stepTitle}</span>

        {/* 삭제 아이콘 - 수정: hover 된 경우에만 표시 */}
        <button
          onClick={handleDeleteClick}
          className={`transition-opacity duration-150 ml-1 p-1 rounded-sm hover:bg-gray-200 text-gray-500 hover:text-red-500 flex-shrink-0 w-6 h-6 flex items-center justify-center ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
          title="단계 삭제"
        >
          <IconTrash size={14} />
        </button>
      </div>

      {/* 삭제 확인 모달 */}
      <DeleteStepModal
        isOpen={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        stepTitle={stepTitle}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeletingStep}
      />
    </>
  );
};
