import React from "react";
import { Block, BlockType } from "../types";
import { JourneySidebarRenderer } from "./implementations/journey/JourneySidebarRenderer";
import { JourneyContentRenderer } from "./implementations/journey/JourneyContentRenderer";
import { StepGroupSidebarRenderer } from "./implementations/stepGroup/StepGroupSidebarRenderer";
import { StepSidebarRenderer } from "./implementations/step/StepSidebarRenderer";
import { StepContentRenderer } from "./implementations/step/StepContentRenderer";

/**
 * 렌더링 영역 타입
 */
export enum RenderingArea {
  SIDEBAR = "sidebar",
  CONTENT = "content",
}

/**
 * 블록 렌더러 속성
 */
export interface BlockRendererProps {
  block: Block;
  area: RenderingArea;
}

/**
 * 블록 렌더러 팩토리 컴포넌트
 *
 * 블록 타입과 렌더링 영역에 따라 적절한 렌더러 컴포넌트를 반환합니다.
 */
export const BlockRenderer: React.FC<BlockRendererProps> = ({
  block,
  area,
}) => {
  // 블록 타입과 영역에 따라 적절한 렌더러 선택
  switch (block.type) {
    case BlockType.JOURNEY:
      if (area === RenderingArea.SIDEBAR) {
        return <JourneySidebarRenderer block={block} />;
      } else if (area === RenderingArea.CONTENT) {
        return <JourneyContentRenderer block={block} />;
      }
      break;

    case BlockType.STEP_GROUP:
      if (area === RenderingArea.SIDEBAR) {
        return <StepGroupSidebarRenderer block={block} />;
      }
      // StepGroup은 Content 영역에서 직접 렌더링되지 않음
      break;

    case BlockType.STEP:
      if (area === RenderingArea.SIDEBAR) {
        return <StepSidebarRenderer block={block} />;
      } else if (area === RenderingArea.CONTENT) {
        return <StepContentRenderer block={block} />;
      }
      break;
  }

  // 지원하지 않는 블록 타입이나 영역인 경우
  return <div>Unsupported block type or area: {block.type}</div>;
};
