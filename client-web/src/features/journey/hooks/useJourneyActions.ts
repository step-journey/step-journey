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
  updateBlock,
} from "@/features/block/services/blockService";
import {
  createDefaultParagraphBlock,
  generateBlockId,
} from "@/features/block/utils/blockUtils";
import { JourneyData } from "@/features/journey/types/serviceTypes";

export function useJourneyActions() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddingStep, setIsAddingStep] = useState(false);
  const [isDeletingStep, setIsDeletingStep] = useState(false);
  const [isAddingStepGroup, setIsAddingStepGroup] = useState(false);
  const [isDeletingStepGroup, setIsDeletingStepGroup] = useState(false);

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
          order: 0,
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
    void queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.journeys.detail(journeyId),
    });

    // 페이지 이동
    navigate(`${PATH.JOURNEY}/${journeyId}`);
  };

  // Step Group 추가 함수
  const addStepGroup = async (journeyId: string) => {
    if (!journeyId) return null;

    setIsAddingStepGroup(true);

    try {
      // 1. 해당 Journey block 조회
      const journeyData = await queryClient.fetchQuery<JourneyData>({
        queryKey: QUERY_KEYS.journeys.detail(journeyId),
      });

      if (!journeyData) {
        console.error("Journey data not found");
        toast.error("Journey 데이터를 찾을 수 없습니다.");
        return null;
      }

      const { journeyBlock } = journeyData;
      if (!journeyBlock) {
        toast.error("Journey 블록을 찾을 수 없습니다.");
        return null;
      }

      // 2. 새 step group ID 생성
      const groupId = generateBlockId();

      // 3. 기본 step group 생성
      const stepNewGroup: Partial<Block> = {
        id: groupId,
        type: BlockType.STEP_GROUP,
        parentId: journeyId,
        childrenIds: [],
        createdBy: "user",
        properties: {
          title: "새 그룹",
        },
      };

      // 4. 부모 Journey block 업데이트
      await updateBlock({
        id: journeyId,
        childrenIds: [...(journeyBlock.childrenIds || []), groupId],
      });

      // 5. DB에 저장
      await createBlock(stepNewGroup);

      // 6. 리스트 새로고침
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.journeys.detail(journeyId),
      });

      toast.success("새 그룹이 추가되었습니다.");
      return { groupId };
    } catch (error) {
      console.error("Failed to add step group:", error);
      toast.error("그룹 추가에 실패했습니다.");
      return null;
    } finally {
      setIsAddingStepGroup(false);
    }
  };

  // Step Group 삭제 함수
  const deleteStepGroup = async (journeyId: string, groupId: string) => {
    if (!journeyId || !groupId) return false;

    setIsDeletingStepGroup(true);

    try {
      // 1. Journey 와 Step Group 블록 조회
      const journeyData = await queryClient.fetchQuery<JourneyData>({
        queryKey: QUERY_KEYS.journeys.detail(journeyId),
      });

      if (!journeyData) {
        console.error("Journey data not found");
        toast.error("여정 데이터를 찾을 수 없습니다.");
        return false;
      }

      const { journeyBlock, allBlocks } = journeyData;

      if (!journeyBlock) {
        console.error("Journey block not found");
        toast.error("여정 블록을 찾을 수 없습니다.");
        return false;
      }

      // Step Group 블록 찾기
      const groupBlock = allBlocks.find((block) => block.id === groupId);
      if (!groupBlock) {
        console.error("Group block not found");
        toast.error("그룹 데이터를 찾을 수 없습니다.");
        return false;
      }

      // 2. 부모 Journey 에서 group ID 제거
      const updatedChildrenIds = journeyBlock.childrenIds.filter(
        (id) => id !== groupId,
      );

      // 3. 해당 group 을 트리째로 삭제 (모든 step 과 그 자식들도 모두 삭제)
      await deleteBlockTree(groupId);

      // 4. 부모 Journey 블록 업데이트
      await updateBlock({
        id: journeyId,
        childrenIds: updatedChildrenIds,
      });

      // 5. 리스트 새로고침
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.journeys.detail(journeyId),
      });

      toast.success("그룹이 삭제되었습니다.");
      return true;
    } catch (error) {
      console.error("Failed to delete step group:", error);
      toast.error("그룹 삭제에 실패했습니다.");
      return false;
    } finally {
      setIsDeletingStepGroup(false);
    }
  };

  // Step 추가 함수
  const addStep = async (journeyId: string, groupId: string) => {
    if (!journeyId || !groupId) return null;

    setIsAddingStep(true);

    try {
      // 1. 해당 그룹 블록 조회 - 타입 명시
      const journeyData = await queryClient.fetchQuery<JourneyData>({
        queryKey: QUERY_KEYS.journeys.detail(journeyId),
      });

      // throw 대신 early return 사용
      if (!journeyData) {
        console.error("Journey data not found");
        toast.error("여정 데이터를 찾을 수 없습니다.");
        return null;
      }

      const { allBlocks, sortedStepBlocks } = journeyData;
      const groupBlock = allBlocks.find((block: Block) => block.id === groupId);

      // throw 대신 early return 사용
      if (!groupBlock) {
        console.error("Group block not found");
        toast.error("그룹 데이터를 찾을 수 없습니다.");
        return null;
      }

      // 2. 새 Step의 order 결정
      const nextOrder = sortedStepBlocks.length;

      // 3. 새 Step ID 생성
      const stepId = generateBlockId();

      // 4. 기본 스텝 생성
      const newStep: Partial<Block> = {
        id: stepId,
        type: BlockType.STEP,
        parentId: groupId,
        childrenIds: [],
        createdBy: "user",
        properties: {
          title: "새 단계",
          order: nextOrder,
        },
      };

      // 5. 기본 문단 블록 생성
      const defaultParagraphBlock = createDefaultParagraphBlock(stepId);

      // 6. 관계 설정
      newStep.childrenIds = [defaultParagraphBlock.id];

      // 7. 부모 그룹 블록 업데이트
      await updateBlock({
        id: groupId,
        childrenIds: [...(groupBlock.childrenIds || []), stepId],
      });

      // 8. DB에 저장
      await createBlock(newStep);
      await createBlock(defaultParagraphBlock);

      // 9. 리스트 새로고침
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.journeys.detail(journeyId),
      });

      // 10. 새로 추가된 Step 데이터 조회
      const updatedData = await queryClient.fetchQuery<JourneyData>({
        queryKey: QUERY_KEYS.journeys.detail(journeyId),
      });

      if (!updatedData) {
        toast.error("업데이트된 데이터를 가져오지 못했습니다.");
        return { stepId, order: -1 }; // 인덱스를 찾지 못했을 경우
      }

      // 11. 새로 추가된 Step의 order 찾기
      const newStepOrder = updatedData.sortedStepBlocks.findIndex(
        (step) => step.id === stepId,
      );

      toast.success("새 단계가 추가되었습니다.");
      return { stepId, order: newStepOrder };
    } catch (error) {
      console.error("Failed to add step:", error);
      toast.error("단계 추가에 실패했습니다.");
      return null;
    } finally {
      setIsAddingStep(false);
    }
  };

  // Step 삭제 함수
  const deleteStep = async (journeyId: string, stepId: string) => {
    if (!journeyId || !stepId) return null;

    setIsDeletingStep(true);

    try {
      // 1. Step 블록과 관련 데이터 조회
      const journeyData = await queryClient.fetchQuery<JourneyData>({
        queryKey: QUERY_KEYS.journeys.detail(journeyId),
      });

      if (!journeyData) {
        console.error("Journey data not found");
        toast.error("여정 데이터를 찾을 수 없습니다.");
        return null;
      }

      const { allBlocks, sortedStepBlocks } = journeyData;

      // Step 블록 찾기
      const stepBlock = allBlocks.find((block: Block) => block.id === stepId);

      if (!stepBlock) {
        console.error("Step block not found");
        toast.error("단계 데이터를 찾을 수 없습니다.");
        return null;
      }

      // 현재 단계의 order 찾기
      const currentStepOrder = sortedStepBlocks.findIndex(
        (step) => step.id === stepId,
      );

      // 부모 그룹 블록 찾기
      const parentId = stepBlock.parentId;
      if (!parentId) {
        console.error("Step has no parent group");
        toast.error("단계에 부모 그룹이 없습니다.");
        return null;
      }

      const groupBlock = allBlocks.find(
        (block: Block) => block.id === parentId,
      );

      if (!groupBlock) {
        console.error("Parent group block not found");
        toast.error("그룹 데이터를 찾을 수 없습니다.");
        return null;
      }

      // 2. 부모 그룹에서 step ID 제거
      const updatedChildrenIds = groupBlock.childrenIds.filter(
        (id) => id !== stepId,
      );

      // 3. 해당 step을 트리째로 삭제 (자식들도 모두 삭제)
      await deleteBlockTree(stepId);

      // 4. 부모 그룹 블록 업데이트 - 명확한 string 타입 보장
      await updateBlock({
        id: parentId, // 이제 parentId는 null 체크를 통과했으므로 string 타입이 됨
        childrenIds: updatedChildrenIds,
      });

      // 5. 리스트 새로고침
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.journeys.detail(journeyId),
      });

      toast.success("단계가 삭제되었습니다.");

      // 삭제 후 이동할 다음 인덱스 계산 (이전 인덱스로 이동, 없으면 0)
      const nextOrder = Math.max(0, currentStepOrder - 1);

      // 데이터 다시 가져오기
      const updatedData = await queryClient.fetchQuery<JourneyData>({
        queryKey: QUERY_KEYS.journeys.detail(journeyId),
      });

      // 다음 인덱스가 유효하지 않으면 조정
      return updatedData && updatedData.sortedStepBlocks.length > 0
        ? Math.min(nextOrder, updatedData.sortedStepBlocks.length - 1)
        : 0;
    } catch (error) {
      console.error("Failed to delete step:", error);
      toast.error("단계 삭제에 실패했습니다.");
      return null;
    } finally {
      setIsDeletingStep(false);
    }
  };

  return {
    createJourney,
    deleteJourney,
    navigateToJourney,
    addStep,
    deleteStep,
    addStepGroup,
    deleteStepGroup,
    isCreating,
    isDeleting,
    isAddingStep,
    isDeletingStep,
    isAddingStepGroup,
    isDeletingStepGroup,
  };
}
