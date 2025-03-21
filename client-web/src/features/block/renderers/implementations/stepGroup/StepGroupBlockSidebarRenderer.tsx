import React, { useState } from "react";
import {
  StepGroupBlock,
  isStepGroupBlock,
  getStepGroupTitle,
} from "../../../types";
import {
  useExpandedGroups,
  useToggleGroup,
} from "@/features/block/store/sidebarStore";
import {
  IconChevronDown,
  IconChevronRight,
  IconEdit,
  IconCornerDownLeft,
  IconTrash,
} from "@tabler/icons-react";
import { EditableStepGroupTitle } from "@/features/block/components/EditableStepGroupTitle";
import { useParams } from "react-router-dom";
import { useJourneyActions } from "@/features/journey/hooks/useJourneyActions";
import { DeleteStepGroupModal } from "@/features/journey/components/DeleteStepGroupModal";
import { useIsEditMode } from "@/features/block/store/editorStore";

interface StepGroupBlockSidebarRendererProps {
  block: StepGroupBlock;
}

/**
 * StepGroup 블록의 사이드바 렌더러
 */
export const StepGroupBlockSidebarRenderer: React.FC<
  StepGroupBlockSidebarRendererProps
> = ({ block }) => {
  const expandedGroups = useExpandedGroups();
  const toggleGroup = useToggleGroup();
  const { journeyId } = useParams<{ journeyId: string }>();
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const { deleteStepGroup, isDeletingStepGroup } = useJourneyActions();
  // 편집 모드 상태 가져오기
  const isEditMode = useIsEditMode();

  // 타입 가드
  if (!isStepGroupBlock(block)) {
    return <div>Invalid step group block</div>;
  }

  // 현재 그룹이 펼쳐져 있는지 확인
  const isExpanded = expandedGroups[block.id] || false;

  // 그룹 라벨 스타일
  let stepGroupTitleClass = `
    flex items-center h-8 px-2 cursor-pointer w-full
    rounded hover:bg-gray-100 justify-between
  `;

  // 편집 버튼 클릭 핸들러
  const handleEditClick = (e: React.MouseEvent) => {
    if (!isEditMode) return; // View Mode에서는 작동 안 함
    e.stopPropagation(); // 펼치기/접기 방지
    setIsEditing(true);
  };

  // 편집 완료 버튼 클릭 핸들러
  const handleCompleteClick = (e: React.MouseEvent) => {
    if (!isEditMode) return; // View Mode에서는 작동 안 함
    e.stopPropagation(); // 펼치기/접기 방지
    setIsEditing(false);
  };

  // 삭제 버튼 클릭 핸들러
  const handleDeleteClick = (e: React.MouseEvent) => {
    if (!isEditMode) return; // View Mode에서는 작동 안 함
    e.stopPropagation(); // 펼치기/접기 방지
    setIsDeleteModalOpen(true);
  };

  // 삭제 확인 핸들러
  const handleConfirmDelete = async () => {
    if (!journeyId) return;

    const success = await deleteStepGroup(journeyId, block.id);
    if (success) {
      setIsDeleteModalOpen(false);
    }
  };

  const completeEditingHandler = () => {
    setIsEditing(false);
  };

  return (
    <div className="w-full">
      {/* 그룹 라벨 */}
      <div
        className={stepGroupTitleClass}
        onClick={isEditing ? undefined : () => toggleGroup(block.id)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-center justify-between flex-1 truncate">
          {/* 제목 - WYSIWYG 편집 스타일 */}
          <EditableStepGroupTitle
            groupId={block.id}
            value={getStepGroupTitle(block)}
            className="text-sm truncate"
            placeholder="제목 없는 그룹"
            journeyId={journeyId || ""}
            isEditing={isEditing}
            onEditingChange={setIsEditing}
            onComplete={completeEditingHandler}
          />

          {/* 아이콘 컨테이너 - 편집/완료 및 화살표 아이콘 함께 배치 */}
          <div className="flex items-center">
            {/* 편집 또는 완료 아이콘 - 상태에 따라 표시 */}
            {isEditMode && isEditing ? (
              // 편집 중일 때는 저장 아이콘 표시 (무채색)
              <button
                onClick={handleCompleteClick}
                className="transition-opacity duration-150 p-1 rounded-sm hover:bg-gray-200 text-gray-500 hover:text-gray-700 flex-shrink-0 w-6 h-6 flex items-center justify-center mr-1"
                title="편집 완료"
              >
                <IconCornerDownLeft size={14} />
              </button>
            ) : (
              // 편집 중이 아닐 때는 호버 시 편집 아이콘 표시 (무채색)
              // Edit Mode이고 hover 된 경우에만 수정/삭제 아이콘 표시
              isEditMode &&
              isHovered && (
                <>
                  <button
                    onClick={handleEditClick}
                    className="transition-opacity duration-150 p-1 rounded-sm hover:bg-gray-200 text-gray-500 hover:text-gray-700 flex-shrink-0 w-6 h-6 flex items-center justify-center mr-1"
                    title="그룹 이름 편집"
                  >
                    <IconEdit size={14} />
                  </button>
                  <button
                    onClick={handleDeleteClick}
                    className="transition-opacity duration-150 p-1 rounded-sm hover:bg-gray-200 text-gray-500 hover:text-red-500 flex-shrink-0 w-6 h-6 flex items-center justify-center mr-1"
                    title="그룹 삭제"
                  >
                    <IconTrash size={14} />
                  </button>
                </>
              )
            )}

            {/* 화살표 아이콘 - 항상 표시 (무채색) */}
            {isExpanded ? (
              <IconChevronDown className="h-4 w-4 flex-shrink-0 text-gray-500" />
            ) : (
              <IconChevronRight className="h-4 w-4 flex-shrink-0 text-gray-500" />
            )}
          </div>
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      <DeleteStepGroupModal
        isOpen={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        groupTitle={getStepGroupTitle(block)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeletingStepGroup}
      />
    </div>
  );
};
