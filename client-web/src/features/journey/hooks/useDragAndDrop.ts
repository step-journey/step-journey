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
import { DND_TYPES } from "@/features/journey/constants/dndTypes";

// 드롭 타겟 위치를 나타내는 타입
interface DropTargetPosition {
  stepGroupBlockId: string;
  insertionIndex: number;
}

// 드래그 앤 드롭 상태 인터페이스
interface DragAndDropState {
  draggedStepBlockId: string | null;
  draggedStepBlock: Block | null;
  sourceStepGroupId: string | null;
  hoveredStepGroupId: string | null;
  dropTargetPosition: DropTargetPosition | null;
}

interface UseDragAndDropProps {
  journeyId: string | undefined;
  allBlocks: Block[];
  onExpandGroup?: (groupId: string) => void;
}

// 정렬 관련 상수
const ORDER_INITIAL_GAP = 1.0; // 스텝 간 기본 간격 (정수로 유지)
const REBALANCING_THRESHOLD = 100; // 이 횟수 이상 스텝 이동 시 전체 재정렬 수행
let movesWithoutRebalancing = 0; // 재정렬 없이 진행된 이동 횟수

export const useDragAndDrop = ({
  journeyId,
  allBlocks,
  onExpandGroup,
}: UseDragAndDropProps) => {
  const queryClient = useQueryClient();

  // 초기 상태 정의
  const initialState: DragAndDropState = {
    draggedStepBlockId: null,
    draggedStepBlock: null,
    sourceStepGroupId: null,
    hoveredStepGroupId: null,
    dropTargetPosition: null,
  };

  // 드래그 앤 드롭 상태
  const [state, setStateRaw] = useState<DragAndDropState>(initialState);

  // 타입 안전한 상태 업데이트 함수들
  const setDraggedStep = (stepId: string | null, stepBlock: Block | null) => {
    setStateRaw((prev) => ({
      ...prev,
      draggedStepBlockId: stepId,
      draggedStepBlock: stepBlock,
    }));
  };

  const setSourceGroup = (groupId: string | null) => {
    setStateRaw((prev) => ({
      ...prev,
      sourceStepGroupId: groupId,
    }));
  };

  const setHoveredGroup = (groupId: string | null) => {
    setStateRaw((prev) => ({
      ...prev,
      hoveredStepGroupId: groupId,
      // 그룹 위에 있을 때는 드롭 위치 지우기
      dropTargetPosition: groupId !== null ? null : prev.dropTargetPosition,
    }));
  };

  const setDropPosition = (position: DropTargetPosition | null) => {
    setStateRaw((prev) => ({
      ...prev,
      dropTargetPosition: position,
      // 드롭 위치가 있을 때는 호버 그룹 지우기
      hoveredStepGroupId: position !== null ? null : prev.hoveredStepGroupId,
    }));
  };

  const resetDragState = () => {
    setStateRaw(initialState);
  };

  // 드래그 감지 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px 이상 움직여야 드래그 시작
      },
    }),
  );

  /**
   * 두 스텝 사이의 새 순서값 계산
   */
  const calculateMiddleOrder = (
    prevOrder: number | undefined,
    nextOrder: number | undefined,
  ): number => {
    if (prevOrder === undefined) {
      // 맨 앞에 삽입하는 경우
      return nextOrder !== undefined ? nextOrder - ORDER_INITIAL_GAP : 0;
    }

    if (nextOrder === undefined) {
      // 맨 뒤에 삽입하는 경우
      return prevOrder + ORDER_INITIAL_GAP;
    }

    // 두 스텝 사이에 삽입하는 경우
    return (prevOrder + nextOrder) / 2;
  };

  /**
   * 그룹 내 모든 스텝의 순서 재조정
   */
  const rebalanceStepOrders = async (groupId: string, steps: StepBlock[]) => {
    console.log(`리밸런싱: 그룹 ${groupId}의 ${steps.length}개 스텝`);

    // 현재 순서에 따라 정렬
    const sortedSteps = [...steps].sort(
      (a, b) =>
        (typeof a.properties.order === "number" ? a.properties.order : 0) -
        (typeof b.properties.order === "number" ? b.properties.order : 0),
    );

    // 정수 간격으로 순서값 재설정
    const updatePromises = sortedSteps.map((step, index) => {
      return updateBlock({
        id: step.id,
        properties: {
          order: index * ORDER_INITIAL_GAP,
        },
      });
    });

    await Promise.all(updatePromises);
    movesWithoutRebalancing = 0; // 리밸런싱 카운터 초기화
    toast.success("스텝 순서가 최적화되었습니다");
  };

  /**
   * 그룹 간 스텝 이동 처리
   */
  const moveStepBetweenGroups = async (
    stepId: string,
    sourceGroupId: string,
    targetGroupId: string,
  ) => {
    // 출발지/목적지 그룹 찾기
    const sourceGroup = allBlocks.find((block) => block.id === sourceGroupId);
    const targetGroup = allBlocks.find((block) => block.id === targetGroupId);

    if (!sourceGroup || !targetGroup) {
      throw new Error("그룹을 찾을 수 없습니다");
    }

    // 1. 출발지 그룹에서 스텝 제거
    await updateBlock({
      id: sourceGroupId,
      childrenIds: sourceGroup.childrenIds.filter((id) => id !== stepId),
    });

    // 2. 목적지 그룹에 스텝 추가
    const newChildrenIds = [...targetGroup.childrenIds];
    if (!newChildrenIds.includes(stepId)) {
      newChildrenIds.push(stepId);
    }

    await updateBlock({
      id: targetGroupId,
      childrenIds: newChildrenIds,
    });

    // 3. 스텝의 부모 그룹 ID 업데이트
    await updateBlock({
      id: stepId,
      parentId: targetGroupId,
    });

    // 4. 목적지 그룹 확장 (UI)
    if (onExpandGroup) {
      onExpandGroup(targetGroupId);
    }
  };

  /**
   * 스텝을 그룹 끝에 추가
   */
  const appendStepToGroup = async (
    stepId: string,
    targetGroupId: string,
    stepBlock: StepBlock,
  ) => {
    // 대상 그룹의 스텝들 가져오기
    const stepsInGroup = allBlocks.filter(
      (block) =>
        block.parentId === targetGroupId && block.type === BlockType.STEP,
    ) as StepBlock[];

    // 현재 최대 순서값 계산
    let lastOrder = 0;
    if (stepsInGroup.length > 0) {
      const orderValues = stepsInGroup
        .map((step) => step.properties.order)
        .filter((order): order is number => typeof order === "number");

      lastOrder = orderValues.length > 0 ? Math.max(...orderValues) : 0;
    }

    // 마지막 스텝 다음에 위치하도록 순서값 설정
    await updateBlock({
      id: stepId,
      parentId: targetGroupId,
      properties: {
        ...stepBlock.properties,
        order: lastOrder + ORDER_INITIAL_GAP,
      },
    });

    movesWithoutRebalancing++;
  };

  /**
   * 스텝 순서 재배치
   */
  const reorderStepInStepGroup = async (
    stepId: string,
    targetGroupId: string,
    dropIndex: number,
  ) => {
    // 대상 그룹의 모든 스텝 가져오기
    const stepsInGroup = allBlocks.filter(
      (block) =>
        block.parentId === targetGroupId && block.type === BlockType.STEP,
    ) as StepBlock[];

    // 순서대로 정렬
    const sortedSteps = [...stepsInGroup].sort(
      (a, b) =>
        (typeof a.properties.order === "number" ? a.properties.order : 0) -
        (typeof b.properties.order === "number" ? b.properties.order : 0),
    );

    // 드래그 중인 아이템의 원래 위치 인덱스 찾기 (인덱스 조정을 위해 필요한 시작점 정보)
    const currentIndex = sortedSteps.findIndex((step) => step.id === stepId);

    // 자기 자신 제외한 리스트 생성 (드래그한 아이템을 제외하고 중간 위치의 order 값을 계산하기 위함)
    const filteredSteps = sortedSteps.filter((step) => step.id !== stepId);

    // 스텝이 없는 그룹으로 이동하는 경우 바로 첫 번째 아이템으로 추가
    if (filteredSteps.length === 0) {
      // 빈 그룹에 유일한 아이템으로 추가
      await updateBlock({
        id: stepId,
        properties: {
          order: 0,
        },
      });
      movesWithoutRebalancing++;
      return;
    }

    // 필터링으로 인한 인덱스 차이를 보정해주는 로직
    // 예: [A, B*, C, D, E] 에서 B를 D와 E 사이로 드래그할 때,
    // B가 제거된 배열 [A, C, D, E]에서는 원래 인덱스 4(D와 E 사이)가 실제로는 3(D와 E 사이)가 됨
    let adjustedDropIndex = dropIndex;
    if (currentIndex < dropIndex) {
      // 현재 위치가 드롭 위치보다 위에 있는 경우, 필터링으로 인덱스가 하나 줄어들었으므로 1을 빼서 조정해야 함
      adjustedDropIndex = dropIndex - 1;
    }

    // 안전 검사: 조정된 인덱스가 유효한 범위인지 확인
    adjustedDropIndex = Math.max(
      0,
      Math.min(adjustedDropIndex, filteredSteps.length),
    );

    // 삽입 위치 계산
    let prevOrder: number | undefined;
    let nextOrder: number | undefined;

    if (adjustedDropIndex === 0) {
      // 맨 앞에 삽입
      nextOrder = filteredSteps[0]?.properties.order;
    } else if (adjustedDropIndex >= filteredSteps.length) {
      // 맨 뒤에 삽입
      prevOrder = filteredSteps[filteredSteps.length - 1]?.properties.order;
    } else {
      // 중간에 삽입 - 안전하게 접근
      if (adjustedDropIndex > 0 && adjustedDropIndex < filteredSteps.length) {
        prevOrder = filteredSteps[adjustedDropIndex - 1]?.properties.order;
        nextOrder = filteredSteps[adjustedDropIndex]?.properties.order;
      } else if (adjustedDropIndex === 0) {
        nextOrder = filteredSteps[0]?.properties.order;
      } else {
        prevOrder = filteredSteps[filteredSteps.length - 1]?.properties.order;
      }
    }

    // 새 순서값 계산 및 업데이트
    const newOrder = calculateMiddleOrder(prevOrder, nextOrder);
    await updateBlock({
      id: stepId,
      properties: {
        order: newOrder,
      },
    });

    movesWithoutRebalancing++;

    // 임계값 초과 시 리밸런싱
    if (movesWithoutRebalancing >= REBALANCING_THRESHOLD) {
      await rebalanceStepOrders(targetGroupId, stepsInGroup);
    }
  };

  /**
   * 드래그 시작 처리: 무엇을 드래그하기 시작했는지 기록
   */
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const stepData = active.data.current;

    if (stepData && stepData.block) {
      // 개별 상태 설정 함수 사용
      setDraggedStep(active.id as string, stepData.block as Block);
      setSourceGroup(stepData.block.parentId);
      setHoveredGroup(null);
      setDropPosition(null);
    }
  };

  /**
   * 드래그 오버 처리: 드래그 중인 요소가 어디에 있는지 추적하고 드롭 가능한 위치를 시각적으로 표시
   */
  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (!over) {
      // 드롭 가능한 영역 위에 없는 경우
      setHoveredGroup(null);
      setDropPosition(null);
      return;
    }

    const overData = over.data.current;
    if (!overData) return;

    if (overData.type === DND_TYPES.STEP_GROUP) {
      // 케이스 1: 스텝 그룹 자체 위에 있을 때
      setHoveredGroup(overData.groupId);
    } else if (overData.type === DND_TYPES.STEP_GAP) {
      // 케이스 2: 스텝 사이 갭 위에 있을 때
      setDropPosition({
        stepGroupBlockId: overData.groupId,
        insertionIndex: overData.index,
      });
    } else {
      // 케이스 3: 다른 타입 위에 있을 때 (드롭 불가 영역)
      setHoveredGroup(null);
      setDropPosition(null);
    }
  };

  /**
   * 드래그 종료 처리: 항목이 드롭되었을 때 실제 데이터 변경을 수행
   */
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    // 상태 저장 후 초기화 (드래그 작업 종료)
    const { draggedStepBlockId, sourceStepGroupId, dropTargetPosition } = state;

    // 작업 후 상태 초기화
    resetDragState();

    // 유효성 검사
    if (
      !over ||
      !active ||
      !journeyId ||
      !sourceStepGroupId ||
      !draggedStepBlockId
    )
      return;

    const stepBlock = allBlocks.find(
      (block) => block.id === draggedStepBlockId,
    ) as StepBlock | undefined;
    if (!stepBlock) return;

    try {
      // 케이스 1: 그룹 자체에 드롭한 경우
      if (over.data.current?.type === DND_TYPES.STEP_GROUP) {
        const targetGroupId = over.data.current.groupId;

        // 동일 그룹 내 이동이면 무시
        if (targetGroupId === sourceStepGroupId) return;

        // 다른 그룹으로 이동: 두 단계 작업 수행
        await moveStepBetweenGroups(
          draggedStepBlockId,
          sourceStepGroupId,
          targetGroupId,
        );
        await appendStepToGroup(draggedStepBlockId, targetGroupId, stepBlock);
      }
      // 케이스 2: 스텝 사이에 드롭한 경우
      else if (
        over.data.current?.type === DND_TYPES.STEP_GAP &&
        dropTargetPosition
      ) {
        const { stepGroupBlockId: targetGroupId, insertionIndex: dropIndex } =
          dropTargetPosition;

        // 다른 그룹으로 이동하는 경우 먼저 그룹 변경
        if (sourceStepGroupId !== targetGroupId) {
          await moveStepBetweenGroups(
            draggedStepBlockId,
            sourceStepGroupId,
            targetGroupId,
          );
        }

        // 순서 재배치 (동일 그룹 내 이동과 다른 그룹으로 이동 모두 적용)
        await reorderStepInStepGroup(
          draggedStepBlockId,
          targetGroupId,
          dropIndex,
        );
      }

      // 변경사항 반영을 위해 캐시 무효화
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.journeys.detail(journeyId),
      });

      toast.success("스텝 위치가 업데이트되었습니다");
    } catch (error) {
      console.error("스텝 위치 업데이트 실패:", error);
      toast.error("스텝 위치 업데이트에 실패했습니다");
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
