import { IconSearch, IconHome, IconPlus } from "@tabler/icons-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Block,
  BlockType,
  JourneyBlock,
  isJourneyBlock,
  StepContainerMap,
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
  const { addStep, isAddingStep } = useJourneyActions();
  const expandedGroups = useExpandedGroups();
  const toggleGroup = useToggleGroup();
  const setCurrentStepIndex = useBlockStore(
    (state) => state.setCurrentStepIndex,
  );

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
            className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <Input
            type="text"
            placeholder="Search"
            className="pl-7 pr-2 py-1 text-sm w-full border-gray-200 bg-gray-50"
          />
        </div>
      </div>

      {/* 단계 목록 스크롤 영역 */}
      <ScrollArea className="flex-1 py-2 pl-4 pr-1">
        {stepGroupBlocks.map((groupBlock) => (
          <div key={groupBlock.id} className="mb-3">
            <div className="flex justify-between items-center">
              <BlockRenderer block={groupBlock} area={RenderingArea.SIDEBAR} />
            </div>

            {/* Step 추가 버튼 - 그룹이 펼쳐져 있을 때만 표시 */}
            {expandedGroups[groupBlock.id] && (
              <div className="ml-5 mt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => handleAddStep(groupBlock.id)}
                  disabled={isAddingStep}
                >
                  <IconPlus size={12} className="mr-1" />새 단계 추가
                </Button>
              </div>
            )}
          </div>
        ))}
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
