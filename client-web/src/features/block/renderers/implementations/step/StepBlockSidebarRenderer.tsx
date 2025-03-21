import React, { useState, useRef } from "react";
import { StepBlock, isStepBlock } from "../../../types";
import {
  useCurrentStepId,
  useHandleStepClick,
} from "@/features/block/store/sidebarStore";
import { useEditingStepTitle } from "@/features/block/store/stepTitleStore";
import { useParams } from "react-router-dom";
import { useJourneyActions } from "@/features/journey/hooks/useJourneyActions";
import { useBlockStore } from "@/features/block/store/blockStore";
import { IconTrash, IconCornerDownLeft } from "@tabler/icons-react";
import { DeleteStepModal } from "@/features/journey/components/DeleteStepModal";
import { updateBlock } from "@/features/block/services/blockService";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { cn } from "@/lib/utils";
import { useIsEditMode } from "@/features/block/store/editorStore";

interface StepBlockSidebarRendererProps {
  block: StepBlock;
}

export const StepBlockSidebarRenderer: React.FC<
  StepBlockSidebarRendererProps
> = ({ block }) => {
  const { journeyId } = useParams<{ journeyId: string }>();
  const currentStepId = useCurrentStepId();
  const handleStepClick = useHandleStepClick();
  const setCurrentStepOrder = useBlockStore(
    (state) => state.setCurrentStepOrder,
  );
  const { deleteStep, isDeletingStep } = useJourneyActions();
  const queryClient = useQueryClient();
  const isEditMode = useIsEditMode();

  // Local states for hover effect and delete modal
  const [isHovered, setIsHovered] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // 편집 모드 상태
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(
    block.properties.title || "제목 없음",
  );
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Step 삭제 핸들러
  const handleDeleteClick = (e: React.MouseEvent) => {
    if (!isEditMode) return; // View Mode에서는 작동 안 함
    e.stopPropagation(); // 클릭 이벤트 버블링 방지
    setIsDeleteModalOpen(true);
  };

  // Step 삭제 확인 핸들러
  const handleConfirmDelete = async () => {
    if (!journeyId) return;

    const nextStepOrder = await deleteStep(journeyId, block.id);

    if (nextStepOrder !== null) {
      setCurrentStepOrder(nextStepOrder);
      setIsDeleteModalOpen(false);
    }
  };

  // 더블 클릭으로 편집 모드로 전환
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!isEditMode) return; // View Mode에서는 작동 안 함

    e.stopPropagation(); // 클릭 이벤트 버블링 방지
    if (!isEditing) {
      setEditTitle(stepTitle);
      setIsEditing(true);
      // 다음 렌더링 사이클에서 input에 포커스
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select(); // 텍스트 전체 선택
        }
      }, 0);
    }
  };

  // 편집 완료 핸들러
  const handleEditComplete = async () => {
    if (!journeyId) return;

    try {
      // 서버에 제목 업데이트
      await updateBlock({
        id: block.id,
        properties: {
          title: editTitle,
        },
      });

      // 쿼리 캐시 무효화 - journey 상세 정보 갱신
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.journeys.detail(journeyId),
      });

      setIsEditing(false);
    } catch (error) {
      console.error("스텝 제목 저장 중 오류:", error);
    }
  };

  // 스타일 클래스 구성
  const stepClass = cn(
    "flex justify-between items-center px-2 py-1 rounded text-sm cursor-pointer group h-[28px]",
    !isEditing && "hover:bg-gray-100",
    isActive ? "bg-gray-100 font-medium text-blue-600" : "",
  );

  return (
    <>
      <div
        id={`step-${block.id}`}
        className={stepClass}
        onClick={() => !isEditing && handleStepClick(block.id)}
        onDoubleClick={handleDoubleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {isEditMode && isEditing ? (
          // 편집 모드 UI
          <div
            className="flex items-center w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              ref={inputRef}
              className="flex-1 bg-blue-50 border border-blue-200 rounded px-2 py-0.5 text-sm outline-none focus:ring-1 focus:ring-blue-300 min-w-[100px]"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleEditComplete}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleEditComplete();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  setIsEditing(false);
                }
              }}
            />
            <button
              onClick={handleEditComplete}
              className="ml-1 p-1 rounded-sm hover:bg-gray-200 text-gray-500 hover:text-gray-700 flex-shrink-0 w-6 h-6 flex items-center justify-center"
              title="편집 완료"
            >
              <IconCornerDownLeft size={14} />
            </button>
          </div>
        ) : (
          // 일반 모드 UI
          <>
            <span className="truncate flex-1">{stepTitle}</span>

            {/* 삭제 아이콘 - hover 된 경우에만 표시 */}
            {isEditMode && isHovered && (
              <button
                onClick={handleDeleteClick}
                className="transition-opacity duration-150 ml-1 p-1 rounded-sm hover:bg-gray-200 text-gray-500 hover:text-red-500 flex-shrink-0 w-6 h-6 flex items-center justify-center"
                title="단계 삭제"
              >
                <IconTrash size={14} />
              </button>
            )}
          </>
        )}
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
