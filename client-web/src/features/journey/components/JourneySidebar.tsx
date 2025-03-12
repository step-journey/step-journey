import {
  IconSearch,
  IconChevronRight,
  IconChevronDown,
  IconHome,
} from "@tabler/icons-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  FlattenedBlock,
  Block,
  BlockType,
  JourneyBlock,
  StepGroupBlock,
  StepBlock,
  isJourneyBlock,
  getJourneyTitle,
  getStepGroupLabel,
  getStepLabel,
} from "@/features/journey/types";
import React from "react";
import { Button } from "@/components/ui/button";
import { getChildBlocksByType } from "@/features/journey/utils/blockUtils";

interface Props {
  journeyBlock: Block;
  currentStep: FlattenedBlock;
  allBlocks: Block[];
  expandedGroups: Record<string, boolean>;
  setExpandedGroups: (groupId: string) => void;
  stepContainerRefs: React.RefObject<Record<string, HTMLDivElement | null>>;
  onClickStep: (groupId: string, stepIdInGroup: number) => void;
  onNavigateHome?: () => void;
}

export function JourneySidebar({
  journeyBlock,
  currentStep,
  allBlocks,
  expandedGroups,
  setExpandedGroups,
  stepContainerRefs,
  onClickStep,
  onNavigateHome,
}: Props) {
  // 그룹 라벨 클릭 => 펼치기/접기 - Zustand 액션으로 변경
  const toggleGroup = (groupId: string) => {
    setExpandedGroups(groupId);
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

  // Journey에서 StepGroup 블록들 가져오기
  const stepGroupBlocks = getChildBlocksByType<StepGroupBlock>(
    typedJourneyBlock,
    allBlocks,
    BlockType.STEP_GROUP,
  );

  return (
    <aside className="flex flex-col border-r border-gray-200 bg-white w-[280px]">
      {/* 상단: 제목 + 검색창 */}
      <div className="shrink-0 p-4 pb-2">
        <h1 className="text-base font-bold mb-3">
          {getJourneyTitle(typedJourneyBlock)}
        </h1>
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
        {stepGroupBlocks.map((groupBlock) => {
          const isExpanded = expandedGroups[groupBlock.id] || false;
          const isCurrentGroup = groupBlock.id === currentStep.parentId;

          let groupLabelClass = `
            flex items-center h-8 px-2 gap-2 cursor-pointer
            rounded hover:bg-gray-100
          `;
          if (isCurrentGroup) {
            groupLabelClass += " font-semibold";
          }

          // 그룹의 스텝 블록들 가져오기
          const stepBlocks = getChildBlocksByType<StepBlock>(
            groupBlock,
            allBlocks,
            BlockType.STEP,
          );

          return (
            <div key={groupBlock.id} className="mb-2">
              {/* 그룹 라벨 */}
              <div
                className={groupLabelClass}
                onClick={() => toggleGroup(groupBlock.id)}
              >
                <span className="text-sm flex-1 whitespace-nowrap">
                  {getStepGroupLabel(groupBlock)}
                </span>
                {isExpanded ? (
                  <IconChevronDown className="h-4 w-4" />
                ) : (
                  <IconChevronRight className="h-4 w-4" />
                )}
              </div>

              {/* 펼쳐진 목록 */}
              {isExpanded && (
                <div
                  ref={(el) => {
                    if (stepContainerRefs.current) {
                      stepContainerRefs.current[groupBlock.id] = el;
                    }
                  }}
                  className="ml-5 mt-1 max-h-[300px] overflow-auto flex flex-col gap-1"
                >
                  {stepBlocks.map((stepBlock) => {
                    const isActive = currentStep.id === stepBlock.id;
                    const stepIdInGroup =
                      stepBlock.properties.stepIdInGroup || 0;

                    const stepClass = [
                      "px-2 py-1 rounded text-sm cursor-pointer hover:bg-gray-100",
                      isActive ? "bg-gray-100 font-medium text-blue-600" : "",
                    ].join(" ");

                    return (
                      <div
                        key={stepBlock.id}
                        id={`step-${stepBlock.id}`}
                        className={stepClass}
                        onClick={() =>
                          onClickStep(groupBlock.id, stepIdInGroup)
                        }
                      >
                        {getStepLabel(stepBlock)}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </ScrollArea>

      {/* 최하단 홈 아이콘 - 스크롤 영역 밖에 배치하여 항상 보이도록 함 */}
      <div className="p-2 mt-auto flex justify-end">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full text-gray-500 hover:text-gray-800"
          onClick={onNavigateHome}
          title="홈으로 돌아가기"
        >
          <IconHome size={18} />
        </Button>
      </div>
    </aside>
  );
}
