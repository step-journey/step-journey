import {
  IconSearch,
  IconHome,
  IconPlus,
  IconFolderPlus,
} from "@tabler/icons-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Block,
  BlockType,
  JourneyBlock,
  isJourneyBlock,
  StepContainerMap,
  StepBlock,
} from "@/features/block/types";
import React, { useRef, useState, useLayoutEffect } from "react";
import { BlockRenderer } from "@/features/block/renderers";
import { useJourneyActions } from "../hooks/useJourneyActions";
import { useParams } from "react-router-dom";
import {
  useExpandedGroups,
  useToggleGroup,
  useCurrentStepId,
} from "@/features/block/store/sidebarStore";
import { useBlockStore } from "@/features/block/store/blockStore";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { DraggableStep } from "./DraggableStep";
import { DroppableStepGroup } from "./DroppableStepGroup";
import { StepDropIndicator } from "./StepDropIndicator";
import { DraggableStepGroup } from "./DraggableStepGroup";
import { StepGroupDropIndicator } from "./StepGroupDropIndicator";
import { useDragAndDrop } from "../hooks/useDragAndDrop";
import { RenderingArea } from "@/features/block/constants/renderingAreaConstants";
import { useIsEditMode } from "@/features/block/store/editorStore";
import { cn } from "@/lib/utils";

interface Props {
  journeyBlock: Block;
  allBlocks: Block[];
  stepContainerRefs?: React.RefObject<StepContainerMap>;
  onNavigateHome?: () => void;
}

export function JourneySidebar({
  journeyBlock,
  allBlocks,
  onNavigateHome,
}: Props) {
  const { journeyId } = useParams<{ journeyId: string }>();
  const { addStep, isAddingStep, addStepGroup, isAddingStepGroup } =
    useJourneyActions();
  const expandedGroups = useExpandedGroups();
  const toggleGroup = useToggleGroup();
  const setCurrentStepOrder = useBlockStore(
    (state) => state.setCurrentStepOrder,
  );
  const currentStepId = useCurrentStepId();
  const isEditMode = useIsEditMode();

  // 버튼 컨테이너의 높이를 관리하는 state
  const [buttonHeight, setButtonHeight] = useState("auto");
  const [, setInitialized] = useState(false);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const hiddenButtonsRef = useRef<HTMLDivElement>(null);

  // 버튼 컨테이너의 실제 높이 측정 - DOM이 그려지기 전에 실행
  useLayoutEffect(() => {
    if (hiddenButtonsRef.current) {
      // 숨겨진 버튼 컨테이너에서 실제 높이 측정
      const height = `${hiddenButtonsRef.current.scrollHeight}px`;
      setButtonHeight(height);
      setInitialized(true);
    }
  }, []);

  // 드래그 앤 드롭 기능을 위한 커스텀 훅
  const {
    draggedStepBlockId,
    draggedStepBlock,
    draggedStepGroupBlockId,
    draggedStepGroupBlock,
    hoveredStepGroupId,
    dropTargetPosition,
    dropGroupTargetIndex,
    sensors,
    collisionDetection,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  } = useDragAndDrop({
    journeyId,
    allBlocks,
    onExpandGroup: (groupId) => {
      if (!expandedGroups[groupId]) {
        toggleGroup(groupId);
      }
    },
  });

  // step block 렌더링 로직과 드래그 앤 드롭
  const renderStepBlocks = (groupBlock: Block) => {
    // 이 그룹에 속한 step block들 찾기
    const stepBlocks = allBlocks.filter(
      (block) =>
        block.parentId === groupBlock.id && block.type === BlockType.STEP,
    ) as StepBlock[];

    // order 기준으로 step block 정렬
    stepBlocks.sort(
      (a, b) => (a.properties.order ?? 0) - (b.properties.order ?? 0),
    );

    // 모든 요소(스텝 + 드롭 표시기)를 담을 배열
    const elements: React.ReactElement[] = [];

    // 맨 처음에 드롭 표시기 추가 - 드래그 중일 때만 활성화
    elements.push(
      <StepDropIndicator
        key={`gap-${groupBlock.id}-0`}
        id={`gap-${groupBlock.id}-0`}
        groupId={groupBlock.id}
        index={0}
        isOver={
          dropTargetPosition?.stepGroupBlockId === groupBlock.id &&
          dropTargetPosition?.insertionIndex === 0
        }
      />,
    );

    // 스텝 추가
    stepBlocks.forEach((stepBlock, i) => {
      elements.push(
        <div key={stepBlock.id} className="relative">
          <DraggableStep id={stepBlock.id} block={stepBlock} />

          {/* 스텝 다음에 드롭 표시기 추가 */}
          <StepDropIndicator
            key={`gap-${groupBlock.id}-${i + 1}`}
            id={`gap-${groupBlock.id}-${i + 1}`}
            groupId={groupBlock.id}
            index={i + 1}
            isOver={
              dropTargetPosition?.stepGroupBlockId === groupBlock.id &&
              dropTargetPosition?.insertionIndex === i + 1
            }
          />
        </div>,
      );
    });

    return elements;
  };

  // 현재 스텝 다음에 스텝 추가 핸들러
  const handleAddNewStep = async () => {
    if (!journeyId) return;

    let targetGroupId: string | undefined;
    let afterStepId: string | undefined;

    // 1. 현재 선택된 스텝이 있는 경우, 그 다음에 추가
    if (currentStepId) {
      const currentStep = allBlocks.find(
        (block) => block.id === currentStepId,
      ) as StepBlock | undefined;

      if (currentStep) {
        targetGroupId = currentStep.parentId;
        afterStepId = currentStepId;
      }
    }

    // 2. 현재 선택된 스텝이 없는 경우, childrenIds 배열 순서대로 첫 번째 그룹에 추가
    if (!targetGroupId && isJourneyBlock(journeyBlock)) {
      // Journey Block의 childrenIds는 UI에 표시되는 순서와 동일함
      for (const childId of journeyBlock.childrenIds) {
        const childBlock = allBlocks.find((block) => block.id === childId);
        if (childBlock && childBlock.type === BlockType.STEP_GROUP) {
          targetGroupId = childId;
          break; // 첫 번째 스텝 그룹을 찾으면 즉시 반복 종료
        }
      }
    }

    // 대상 그룹이 결정되었으면 스텝 추가
    if (targetGroupId) {
      const result = await addStep(journeyId, targetGroupId, afterStepId);

      if (result && result.order !== -1) {
        // 그룹이 접혀있으면 펼치기
        if (!expandedGroups[targetGroupId]) {
          toggleGroup(targetGroupId);
        }

        // 새로 추가된 스텝으로 이동
        setCurrentStepOrder(result.order);
      }
    }
  };

  const handleAddStepGroup = async () => {
    if (journeyId) {
      await addStepGroup(journeyId);
      // 새 step group 이 추가되면 자동으로 데이터가 갱신됨
    }
  };

  // 타입 가드 확인
  if (!isJourneyBlock(journeyBlock)) {
    return (
      <aside className="flex flex-col border-r border-gray-200 bg-white w-[280px]">
        <div className="p-4">Not a valid journey block</div>
      </aside>
    );
  }

  // 타입 안전한 접근을 위해 타입 캐스팅
  const typedJourneyBlock = journeyBlock as JourneyBlock;

  // 여정에 포함된 스텝 그룹 블록들 가져오기
  const stepGroupBlocks = typedJourneyBlock.childrenIds
    .map((id: string) => allBlocks.find((block) => block.id === id))
    .filter(
      (block: Block | undefined) =>
        block && block.type === BlockType.STEP_GROUP,
    ) as Block[];

  // 스텝 추가 버튼 비활성화 여부 결정
  const disableAddStepButton = stepGroupBlocks.length === 0;

  // 버튼 컨텐츠 컴포넌트 - 중복 코드 방지를 위해 추출
  const ButtonsContent = () => (
    <div className="space-y-2">
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start text-xs text-muted-foreground hover:text-foreground transition-colors duration-300"
        onClick={handleAddStepGroup}
        disabled={isAddingStepGroup}
      >
        <IconFolderPlus size={14} className="mr-1" />
        스텝 그룹 추가
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start text-xs text-muted-foreground hover:text-foreground transition-colors duration-300"
        onClick={handleAddNewStep}
        disabled={isAddingStep || disableAddStepButton}
      >
        <IconPlus size={14} className="mr-1" />
        스텝 추가
      </Button>
    </div>
  );

  return (
    <aside className="flex flex-col border-r border-gray-200 bg-white w-[280px]">
      {/* 상단: 제목 + 검색창 */}
      <div className="shrink-0 p-4 pb-2">
        <div className="flex justify-between items-center">
          <BlockRenderer
            block={typedJourneyBlock}
            area={RenderingArea.SIDEBAR}
          />
        </div>

        {/* 검색창 */}
        <div className="relative">
          <IconSearch
            size={16}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <Input
            type="text"
            placeholder="Search"
            className="pl-8 pr-2 py-1 text-sm w-full border-gray-200 bg-gray-50"
          />
        </div>
      </div>

      {/* 스텝 목록 스크롤 영역 */}
      <ScrollArea className="flex-1 py-2 pl-4 pr-1">
        {/* 숨겨진 버튼 컨테이너 - 높이 측정용 (화면에 보이지 않음) */}
        <div
          ref={hiddenButtonsRef}
          className="absolute opacity-0 pointer-events-none"
          aria-hidden="true"
        >
          <ButtonsContent />
        </div>

        {/* 버튼 컨테이너 - 애니메이션 적용 */}
        <div
          ref={buttonsRef}
          className={cn(
            "overflow-hidden transition-all duration-500 ease-in-out mb-4",
            isEditMode ? "opacity-100" : "opacity-0",
          )}
          style={{
            height: isEditMode ? buttonHeight : "0px",
            marginBottom: isEditMode ? "1rem" : "0",
          }}
        >
          <div
            className="transform transition-transform duration-500 ease-out"
            style={{
              transform: isEditMode ? "translateY(0)" : "translateY(-8px)",
            }}
          >
            <ButtonsContent />
          </div>
        </div>

        {/* 드래그 앤 드롭을 위한 DndContext */}
        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetection}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {/* 스텝 그룹 맨 위에 드롭 표시기 */}
          <div className="relative">
            <StepGroupDropIndicator
              key="group-gap-0"
              id="group-gap-0"
              index={0}
              isOver={dropGroupTargetIndex === 0}
            />
          </div>

          {/* 스텝 그룹 매핑 */}
          {stepGroupBlocks.map((groupBlock, index) => (
            <div key={groupBlock.id} className="relative">
              <DraggableStepGroup id={groupBlock.id} block={groupBlock}>
                <div className="mb-2 w-full">
                  <DroppableStepGroup
                    id={groupBlock.id}
                    isOver={hoveredStepGroupId === groupBlock.id}
                  >
                    {/* 그룹 블록 헤더 */}
                    <BlockRenderer
                      block={groupBlock}
                      area={RenderingArea.SIDEBAR}
                    />
                  </DroppableStepGroup>

                  {/* 스텝 블록과 드롭 표시기 - 별도 컨테이너로 분리 */}
                  {expandedGroups[groupBlock.id] && (
                    <div className="ml-5 mt-1">
                      {/* 드롭 표시기가 있는 스텝 */}
                      <div className="step-items-container gap-1">
                        {renderStepBlocks(groupBlock)}
                      </div>
                    </div>
                  )}
                </div>
              </DraggableStepGroup>

              {/* 스텝 그룹 다음에 드롭 표시기 */}
              <StepGroupDropIndicator
                key={`group-gap-${index + 1}`}
                id={`group-gap-${index + 1}`}
                index={index + 1}
                isOver={dropGroupTargetIndex === index + 1}
              />
            </div>
          ))}

          {/* 드래그 오버레이 - 드래그 중인 아이템의 복제본을 보여줌 */}
          <DragOverlay dropAnimation={null}>
            {draggedStepBlock && (
              <DraggableStep
                id={draggedStepBlockId || ""}
                block={draggedStepBlock}
                isDragOverlay={true}
              />
            )}
            {draggedStepGroupBlock && (
              <DraggableStepGroup
                id={draggedStepGroupBlockId || ""}
                block={draggedStepGroupBlock}
                isDragOverlay={true}
              >
                <div className="mb-3 w-full">
                  <BlockRenderer
                    block={draggedStepGroupBlock}
                    area={RenderingArea.SIDEBAR}
                  />
                </div>
              </DraggableStepGroup>
            )}
          </DragOverlay>
        </DndContext>
      </ScrollArea>

      {/* 최하단 홈 아이콘 - 스크롤 영역 밖에 배치하여 항상 보이도록 함 */}
      <div className="p-4 mt-auto flex justify-center">
        <div
          className="cursor-pointer rounded-full p-3 hover:bg-gray-100 transition-colors"
          onClick={onNavigateHome}
          title="홈으로 돌아가기"
        >
          <IconHome
            size={24}
            className="text-gray-600 hover:text-gray-900"
            stroke={1.5}
          />
        </div>
      </div>
    </aside>
  );
}
