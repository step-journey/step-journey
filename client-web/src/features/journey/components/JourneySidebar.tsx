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
import React from "react";
import { BlockRenderer, RenderingArea } from "@/features/block/renderers";
import { useJourneyActions } from "../hooks/useJourneyActions";
import { useParams } from "react-router-dom";
import {
  useExpandedGroups,
  useToggleGroup,
} from "@/features/block/store/sidebarStore";
import { useBlockStore } from "@/features/block/store/blockStore";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { DraggableStep } from "./DraggableStep";
import { DroppableStepGroup } from "./DroppableStepGroup";
import { StepDropIndicator } from "./StepDropIndicator";
import { useDragAndDrop } from "../hooks/useDragAndDrop";

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
  const setCurrentStepIndex = useBlockStore(
    (state) => state.setCurrentStepIndex,
  );

  // 드래그 앤 드롭 기능을 위한 커스텀 훅
  const {
    activeId,
    activeBlock,
    overGroupId,
    insertPosition,
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

    // globalIndex 기준으로 step block 정렬
    stepBlocks.sort(
      (a, b) =>
        (a.properties.globalIndex ?? 0) - (b.properties.globalIndex ?? 0),
    );

    // 모든 요소(스텝 + 드롭 표시기)를 담을 배열
    const elements: React.ReactElement[] = [];

    // 맨 처음에 드롭 표시기 추가
    elements.push(
      <StepDropIndicator
        key={`gap-${groupBlock.id}-0`}
        id={`gap-${groupBlock.id}-0`}
        groupId={groupBlock.id}
        index={0}
        isOver={
          insertPosition?.groupId === groupBlock.id &&
          insertPosition?.index === 0
        }
      />,
    );

    // 스텝과 그 사이에 드롭 표시기 추가
    stepBlocks.forEach((stepBlock, i) => {
      // 스텝 추가
      elements.push(
        <DraggableStep
          key={stepBlock.id}
          id={stepBlock.id}
          block={stepBlock}
        />,
      );

      // 스텝 다음에 드롭 표시기 추가
      elements.push(
        <StepDropIndicator
          key={`gap-${groupBlock.id}-${i + 1}`}
          id={`gap-${groupBlock.id}-${i + 1}`}
          groupId={groupBlock.id}
          index={i + 1}
          isOver={
            insertPosition?.groupId === groupBlock.id &&
            insertPosition?.index === i + 1
          }
        />,
      );
    });

    return elements;
  };

  // 유틸리티 함수
  const handleAddStep = async (groupId: string) => {
    if (journeyId) {
      const result = await addStep(journeyId, groupId);

      if (result && result.index !== -1) {
        // 그룹이 접혀있으면 펼치기
        if (!expandedGroups[groupId]) {
          toggleGroup(groupId);
        }

        // 새로 추가된 스텝으로 이동
        setCurrentStepIndex(result.index);
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

  return (
    <aside className="flex flex-col border-r border-gray-200 bg-white w-[280px]">
      {/* 상단: 제목 + 검색창 */}
      <div className="shrink-0 p-4 pb-2">
        <div className="flex justify-between items-center mb-3">
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
        {/* 스텝 그룹 추가 버튼 */}
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs text-muted-foreground hover:text-foreground"
            onClick={handleAddStepGroup}
            disabled={isAddingStepGroup}
          >
            <IconFolderPlus size={14} className="mr-1" />
            스텝 그룹 추가
          </Button>
        </div>

        {/* 드래그 앤 드롭을 위한 DndContext */}
        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetection}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {/* 스텝 그룹 매핑 */}
          {stepGroupBlocks.map((groupBlock) => (
            <DroppableStepGroup
              key={groupBlock.id}
              id={groupBlock.id}
              isOver={overGroupId === groupBlock.id}
            >
              <div className="mb-3 w-full">
                {/* 그룹 블록 헤더 */}
                <BlockRenderer
                  block={groupBlock}
                  area={RenderingArea.SIDEBAR}
                />

                {/* 스텝 블록과 드롭 표시기 */}
                {expandedGroups[groupBlock.id] && (
                  <div className="ml-5 mt-1">
                    {/* 드롭 표시기가 있는 스텝 */}
                    <div className="step-items-container">
                      {renderStepBlocks(groupBlock)}
                    </div>

                    {/* 스텝 추가 버튼 */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs text-muted-foreground hover:text-foreground mt-1"
                      onClick={() => handleAddStep(groupBlock.id)}
                      disabled={isAddingStep}
                    >
                      <IconPlus size={12} className="mr-1" />새 스텝 추가
                    </Button>
                  </div>
                )}
              </div>
            </DroppableStepGroup>
          ))}

          {/* 드래그 오버레이 - 드래그 중인 아이템의 복제본을 보여줌 (애니메이션 제거) */}
          <DragOverlay dropAnimation={null}>
            {activeBlock ? (
              <DraggableStep
                id={activeId || ""}
                block={activeBlock}
                isDragOverlay={true}
              />
            ) : null}
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
