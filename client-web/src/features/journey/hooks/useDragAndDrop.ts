import { useState } from "react";
import {
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import { Block, BlockType, StepBlock } from "@/features/block/types";
import { updateBlock } from "@/features/block/services/blockService";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/queryKeys";

interface DragAndDropState {
  activeId: string | null;
  activeBlock: Block | null;
  activeGroupId: string | null;
  overGroupId: string | null;
  insertPosition: { groupId: string; order: number } | null;
}

interface UseDragAndDropProps {
  journeyId: string | undefined;
  allBlocks: Block[];
  onExpandGroup?: (groupId: string) => void;
}

// 소수점 값으로 스텝을 정렬하기 위한 상수
const ORDER_INITIAL_GAP = 1.0; // 초기 스텝 간의 간격
const REBALANCING_THRESHOLD = 100; // 리밸런싱 임계값 (이 이상 이동이 발생하면 전체 재조정)
let movesWithoutRebalancing = 0; // 리밸런싱 없이 발생한 이동 횟수 추적

export const useDragAndDrop = ({
  journeyId,
  allBlocks,
  onExpandGroup,
}: UseDragAndDropProps) => {
  const queryClient = useQueryClient();

  // State for drag & drop
  const [state, setState] = useState<DragAndDropState>({
    activeId: null,
    activeBlock: null,
    activeGroupId: null,
    overGroupId: null,
    insertPosition: null,
  });

  // Sensors configuration for dnd-kit - 더 민감하게 반응하도록 설정
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px of movement required before drag starts
      },
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;

    const stepData = active.data.current;
    if (stepData && stepData.block) {
      setState({
        activeId: active.id as string,
        activeBlock: stepData.block as Block,
        activeGroupId: stepData.block.parentId,
        overGroupId: null,
        insertPosition: null,
      });
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (!over) {
      setState((prev) => ({
        ...prev,
        overGroupId: null,
        insertPosition: null,
      }));
      return;
    }

    // Get the data from the over element
    const overData = over.data.current;
    if (!overData) return;

    // Handle hovering over a step group
    if (overData.type === "stepGroup") {
      setState((prev) => ({
        ...prev,
        overGroupId: overData.groupId,
        insertPosition: null,
      }));
    }
    // Handle hovering over a gap between steps
    else if (overData.type === "stepGap") {
      setState((prev) => ({
        ...prev,
        overGroupId: null,
        insertPosition: {
          groupId: overData.groupId,
          order: overData.index,
        },
      }));
    }
    // Reset when hovering elsewhere
    else {
      setState((prev) => ({
        ...prev,
        overGroupId: null,
        insertPosition: null,
      }));
    }
  };

  /**
   * 두 스텝 사이의 새 order 값을 계산합니다.
   * @param prevOrder 이전 스텝의 order 값
   * @param nextOrder 다음 스텝의 order 값
   * @returns 두 값 사이의 중간값
   */
  const calculateMiddleOrder = (
    prevOrder: number | undefined,
    nextOrder: number | undefined,
  ): number => {
    // 맨 앞에 삽입하는 경우
    if (prevOrder === undefined) {
      return nextOrder !== undefined ? nextOrder - ORDER_INITIAL_GAP : 0;
    }

    // 맨 뒤에 삽입하는 경우
    if (nextOrder === undefined) {
      return prevOrder + ORDER_INITIAL_GAP;
    }

    // 두 스텝 사이에 삽입하는 경우
    return (prevOrder + nextOrder) / 2;
  };

  /**
   * 필요한 경우 모든 스텝의 order를 재조정합니다.
   * @param _groupId 그룹 ID (로깅 목적)
   * @param steps 해당 그룹의 모든 스텝
   */
  const rebalanceStepOrders = async (_groupId: string, steps: StepBlock[]) => {
    // 언더스코어 접두사로 의도적으로 사용하지 않는 매개변수임을 표시
    console.log(`리밸런싱 수행: 그룹 ${_groupId}의 ${steps.length}개 스텝`);

    // 정렬된 스텝 목록 생성
    const sortedSteps = [...steps].sort(
      (a, b) =>
        (typeof a.properties.order === "number" ? a.properties.order : 0) -
        (typeof b.properties.order === "number" ? b.properties.order : 0),
    );

    // 일정한 간격으로 order 값 재설정
    const updatePromises = sortedSteps.map((step, index) => {
      return updateBlock({
        id: step.id,
        properties: {
          order: index * ORDER_INITIAL_GAP,
        },
      });
    });

    await Promise.all(updatePromises);
    movesWithoutRebalancing = 0; // 리밸런싱 카운터 리셋

    toast.success("스텝 순서가 최적화되었습니다.");
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    // Store current state before resetting
    const { activeId, activeGroupId: previousGroupId } = state;

    // Reset states first
    setState({
      activeId: null,
      activeBlock: null,
      activeGroupId: null,
      overGroupId: null,
      insertPosition: null,
    });

    // Get the active step
    if (!over || !active || !journeyId || !previousGroupId || !activeId) return;

    const stepBlock = allBlocks.find((block) => block.id === activeId) as
      | StepBlock
      | undefined;
    if (!stepBlock) return;

    try {
      // Handle dropping onto a step group
      if (over.data.current?.type === "stepGroup") {
        const targetGroupId = over.data.current.groupId;

        // If dropping to the same group, do nothing
        if (targetGroupId === previousGroupId) return;

        // Find the target group
        const targetGroup = allBlocks.find(
          (block) => block.id === targetGroupId,
        );
        if (!targetGroup) return;

        // Find the source group and remove the step
        const sourceGroup = allBlocks.find(
          (block) => block.id === previousGroupId,
        );
        if (!sourceGroup) return;

        // Update source group by removing the step
        await updateBlock({
          id: previousGroupId,
          childrenIds: sourceGroup.childrenIds.filter((id) => id !== activeId),
        });

        // Update target group by adding the step
        await updateBlock({
          id: targetGroupId,
          childrenIds: [...targetGroup.childrenIds, activeId],
        });

        // 대상 그룹의 스텝들
        const stepsInTargetGroup = allBlocks.filter(
          (block) =>
            block.parentId === targetGroupId && block.type === BlockType.STEP,
        ) as StepBlock[];

        // 마지막 스텝의 order 값 가져오기
        let lastOrder = 0;
        if (stepsInTargetGroup.length > 0) {
          const orderValues = stepsInTargetGroup
            .map((step) => step.properties.order)
            .filter((order): order is number => typeof order === "number");

          lastOrder = orderValues.length > 0 ? Math.max(...orderValues) : 0;
        }

        // 그룹 끝에 스텝 추가 - 마지막 스텝보다 큰 order 값 설정
        await updateBlock({
          id: activeId,
          parentId: targetGroupId,
          properties: {
            ...stepBlock.properties,
            order: lastOrder + ORDER_INITIAL_GAP,
          },
        });

        // 이동 카운터 증가
        movesWithoutRebalancing++;

        // Auto-expand the target group if it's collapsed
        if (onExpandGroup) {
          onExpandGroup(targetGroupId);
        }
      }
      // Handle dropping between steps
      else if (over.data.current?.type === "stepGap" && state.insertPosition) {
        const { groupId: targetGroupId, order: dropIndex } =
          state.insertPosition;

        // Find the target group
        const targetGroup = allBlocks.find(
          (block) => block.id === targetGroupId,
        );
        if (!targetGroup) return;

        // 다른 그룹으로 이동하는 경우
        if (previousGroupId !== targetGroupId) {
          const sourceGroup = allBlocks.find(
            (block) => block.id === previousGroupId,
          );
          if (!sourceGroup) return;

          // 원본 그룹에서 스텝 제거
          await updateBlock({
            id: previousGroupId,
            childrenIds: sourceGroup.childrenIds.filter(
              (id) => id !== activeId,
            ),
          });

          // 대상 그룹에 스텝 추가
          const newChildrenIds = [...targetGroup.childrenIds];
          if (!newChildrenIds.includes(activeId)) {
            newChildrenIds.push(activeId);
          }

          await updateBlock({
            id: targetGroupId,
            childrenIds: newChildrenIds,
          });

          // 스텝의 parentId 업데이트
          await updateBlock({
            id: activeId,
            parentId: targetGroupId,
          });

          // 대상 그룹 확장
          if (onExpandGroup) {
            onExpandGroup(targetGroupId);
          }
        }

        // 대상 그룹 내 모든 스텝 가져오기
        const stepsInTargetGroup = allBlocks.filter(
          (block) =>
            block.parentId === targetGroupId && block.type === BlockType.STEP,
        ) as StepBlock[];

        // 스텝 드롭 위치 결정을 위한 이전/다음 스텝 찾기
        const sortedSteps = [...stepsInTargetGroup].sort(
          (a, b) =>
            (typeof a.properties.order === "number" ? a.properties.order : 0) -
            (typeof b.properties.order === "number" ? b.properties.order : 0),
        );

        // 현재 스텝을 제외한 정렬된 스텝 목록 생성
        const filteredSteps = sortedSteps.filter(
          (step) => step.id !== activeId,
        );

        let prevOrder: number | undefined;
        let nextOrder: number | undefined;

        if (dropIndex === 0) {
          // 맨 앞에 삽입
          nextOrder =
            filteredSteps.length > 0
              ? filteredSteps[0].properties.order
              : undefined;
        } else if (dropIndex >= filteredSteps.length) {
          // 맨 뒤에 삽입
          prevOrder =
            filteredSteps.length > 0
              ? filteredSteps[filteredSteps.length - 1].properties.order
              : undefined;
        } else {
          // 중간에 삽입
          prevOrder = filteredSteps[dropIndex - 1].properties.order;
          nextOrder = filteredSteps[dropIndex].properties.order;
        }

        // 새 order 값 계산
        const newOrder = calculateMiddleOrder(prevOrder, nextOrder);

        // 스텝 업데이트 - 새로운 order 값만 설정
        await updateBlock({
          id: activeId,
          properties: {
            order: newOrder,
          },
        });

        // 이동 카운터 증가
        movesWithoutRebalancing++;

        // 임계값을 초과하면 리밸런싱 수행
        if (movesWithoutRebalancing >= REBALANCING_THRESHOLD) {
          await rebalanceStepOrders(targetGroupId, stepsInTargetGroup);
        }

        // 변경 사항 적용을 위해 쿼리 캐시 무효화
        await queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.journeys.detail(journeyId),
        });

        toast.success("스텝 위치가 업데이트되었습니다.");
      }
    } catch (error) {
      console.error("Failed to update step position:", error);
      toast.error("스텝 위치 업데이트에 실패했습니다.");
    }
  };

  return {
    ...state,
    sensors,
    collisionDetection: closestCenter,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  };
};
