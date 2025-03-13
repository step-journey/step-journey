import React from "react";
import { StepBlock, isStepBlock, getStepTitle } from "../../../types";
import {
  useCurrentStepId,
  useHandleStepClick,
} from "@/features/block/store/sidebarStore";
import { useIsEditMode } from "@/features/block/store/editorStore";
import { IconTrash } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  deleteBlock,
  updateBlock,
} from "@/features/block/services/blockService";
import { toast } from "sonner";
import { useAllBlocks } from "@/features/block/store/blockStore";

interface StepSidebarRendererProps {
  block: StepBlock;
  onRefetch?: () => void;
}

export const StepSidebarRenderer: React.FC<StepSidebarRendererProps> = ({
  block,
  onRefetch,
}) => {
  const currentStepId = useCurrentStepId();
  const handleStepClick = useHandleStepClick();
  const isEditMode = useIsEditMode();
  const allBlocks = useAllBlocks();

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

  // 스텝 삭제 처리
  const handleDeleteStep = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!block.parentId) {
      toast.error("스텝을 삭제할 수 없습니다.");
      return;
    }

    try {
      // 부모 그룹 블록 찾기
      const parentBlock = allBlocks.find((b) => b.id === block.parentId);
      if (!parentBlock) {
        toast.error("부모 그룹을 찾을 수 없습니다.");
        return;
      }

      // 부모 블록의 content에서 현재 스텝 ID 제거
      const updatedParent = {
        ...parentBlock,
        content: parentBlock.content.filter((id) => id !== block.id),
      };

      // 부모 블록 업데이트
      await updateBlock(updatedParent);

      // 스텝 블록 삭제
      await deleteBlock(block.id);

      // 데이터 새로고침
      if (onRefetch) {
        onRefetch();
      }

      toast.success("스텝이 삭제되었습니다.");
    } catch (error) {
      console.error("Failed to delete step:", error);
      toast.error("스텝 삭제에 실패했습니다.");
    }
  };

  return (
    <div
      id={`step-${block.id}`}
      className={stepClass}
      onClick={() => handleStepClick(parentId, stepIdInGroup)}
    >
      <span>{getStepTitle(block)}</span>

      {isEditMode && (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 text-red-500"
            onClick={handleDeleteStep}
          >
            <IconTrash size={12} />
          </Button>
        </div>
      )}
    </div>
  );
};
