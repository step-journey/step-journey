import React from "react";
import {
  StepGroupBlock,
  isStepGroupBlock,
  getStepGroupLabel,
  BlockType,
  StepBlock,
} from "../../../types";
import { useBlockContext } from "@/features/block/renderers";
import { useSidebarContext } from "@/features/block/renderers";
import { BlockRenderer, RenderingArea } from "../../BlockRenderer";
import { IconChevronDown, IconChevronRight } from "@tabler/icons-react";

interface StepGroupSidebarRendererProps {
  block: StepGroupBlock;
}

/**
 * StepGroup 블록의 사이드바 렌더러
 */
export const StepGroupSidebarRenderer: React.FC<
  StepGroupSidebarRendererProps
> = ({ block }) => {
  const { allBlocks } = useBlockContext();
  const { expandedGroups, toggleGroup, currentStepId } = useSidebarContext();

  // 타입 가드
  if (!isStepGroupBlock(block)) {
    return <div>Invalid step group block</div>;
  }

  const isExpanded = expandedGroups[block.id] || false;
  const isCurrentGroup = allBlocks.some(
    (b) => b.parentId === block.id && b.id === currentStepId,
  );

  // 그룹 라벨 스타일
  let groupLabelClass = `
    flex items-center h-8 px-2 gap-2 cursor-pointer
    rounded hover:bg-gray-100
  `;
  if (isCurrentGroup) {
    groupLabelClass += " font-semibold";
  }

  // 그룹에 속한 스텝 블록들 찾기
  const stepBlocks = block.content
    .map((id) => allBlocks.find((b) => b.id === id))
    .filter((b) => b?.type === BlockType.STEP) as StepBlock[];

  return (
    <div className="mb-2">
      {/* 그룹 라벨 */}
      <div className={groupLabelClass} onClick={() => toggleGroup(block.id)}>
        <span className="text-sm flex-1 whitespace-nowrap">
          {getStepGroupLabel(block)}
        </span>
        {isExpanded ? (
          <IconChevronDown className="h-4 w-4" />
        ) : (
          <IconChevronRight className="h-4 w-4" />
        )}
      </div>

      {/* 펼쳐진 목록 */}
      {isExpanded && (
        <div className="ml-5 mt-1 max-h-[300px] overflow-auto flex flex-col gap-1">
          {stepBlocks.map((stepBlock) => (
            <BlockRenderer
              key={stepBlock.id}
              block={stepBlock}
              area={RenderingArea.SIDEBAR}
            />
          ))}
        </div>
      )}
    </div>
  );
};
