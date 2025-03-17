import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import PATH from "@/constants/path";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { Block, BlockType } from "@/features/block/types";
import {
  createBlock,
  deleteBlockTree,
} from "@/features/block/services/blockService";
import { createDefaultParagraphBlock } from "@/features/block/utils/blockUtils";
import { generateBlockId } from "@/features/block/utils/blockUtils";

export function useJourneyActions() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Journey 생성 함수
  const createJourney = async (title: string, description: string) => {
    if (!title.trim()) {
      toast.error("제목을 입력해주세요.");
      return null;
    }

    setIsCreating(true);

    try {
      // 1. ID 생성
      const journeyId = generateBlockId();
      const groupId = generateBlockId();
      const stepId = generateBlockId();

      // 2. 기본 여정 생성
      const newJourney: Partial<Block> = {
        id: journeyId,
        type: BlockType.JOURNEY,
        childrenIds: [],
        createdBy: "user",
        properties: {
          title,
          description,
        },
      };

      // 3. 기본 Step Group 생성
      const newGroup: Partial<Block> = {
        id: groupId,
        type: BlockType.STEP_GROUP,
        parentId: journeyId,
        childrenIds: [],
        createdBy: "user",
        properties: {
          title: "기본 그룹",
        },
      };

      // 4. 기본 스텝 생성
      const newStep: Partial<Block> = {
        id: stepId,
        type: BlockType.STEP,
        parentId: groupId,
        childrenIds: [],
        createdBy: "user",
        properties: {
          title: "시작하기",
          stepIdInGroup: 1,
        },
      };

      // 5. 기본 문단 블록 생성
      const defaultParagraphBlock = createDefaultParagraphBlock(stepId);

      // 6. 관계 설정
      newJourney.childrenIds = [groupId];
      newGroup.childrenIds = [stepId];
      newStep.childrenIds = [defaultParagraphBlock.id];

      // 7. DB에 저장
      await createBlock(newJourney);
      await createBlock(newGroup);
      await createBlock(newStep);
      await createBlock(defaultParagraphBlock);

      // 리스트 새로고침
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.journeys.all,
      });

      toast.success("새 여정이 생성되었습니다.");

      return journeyId;
    } catch (error) {
      console.error("Failed to create journey:", error);
      toast.error("여정 생성에 실패했습니다.");
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  // Journey 삭제 함수
  const deleteJourney = async (journeyId: string) => {
    if (!journeyId) return false;

    setIsDeleting(true);

    try {
      // 여정을 트리째로 삭제 (자식들도 모두 삭제)
      await deleteBlockTree(journeyId);

      // 리스트 새로고침
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.journeys.all,
      });

      toast.success("여정이 삭제되었습니다.");
      return true;
    } catch (error) {
      console.error("Failed to delete journey:", error);
      toast.error("여정 삭제에 실패했습니다.");
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  // 여정 클릭 시 상세 페이지로 이동 및 쿼리 무효화
  const navigateToJourney = (journeyId: string) => {
    // 해당 Journey 관련 쿼리 캐시 무효화
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.journeys.detail(journeyId),
    });

    // 페이지 이동
    navigate(`${PATH.JOURNEY}/${journeyId}`);
  };

  return {
    createJourney,
    deleteJourney,
    navigateToJourney,
    isCreating,
    isDeleting,
  };
}
