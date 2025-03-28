import React from "react";
import { Block, BlockType } from "../types";
import { JourneyBlockSidebarRenderer } from "./implementations/journey/JourneyBlockSidebarRenderer";
import { StepGroupBlockSidebarRenderer } from "./implementations/stepGroup/StepGroupBlockSidebarRenderer";
import { StepBlockSidebarRenderer } from "./implementations/step/StepBlockSidebarRenderer";
import { StepBlockJourneyContentRenderer } from "./implementations/step/StepBlockJourneyContentRenderer";
import { RenderingArea } from "../constants/renderingAreaConstants";

/**
 * 블록 렌더러 속성
 */
export interface BlockRendererProps {
  block: Block;
  area: RenderingArea;
  journeyId?: string;
}

/**
 * 에러 메시지 컴포넌트
 */
const RenderError: React.FC<{ message: string; details?: string }> = ({
  message,
  details,
}) => (
  <div
    className="block-render-error"
    style={{
      color: "#721c24",
      backgroundColor: "#f8d7da",
      border: "1px solid #f5c6cb",
      borderRadius: "4px",
      padding: "12px",
      margin: "8px 0",
      fontSize: "14px",
    }}
  >
    <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
      ⚠️ 렌더링 오류
    </div>
    <div>{message}</div>
    {details && (
      <div
        style={{
          marginTop: "8px",
          fontSize: "12px",
          color: "#555",
          backgroundColor: "rgba(0,0,0,0.03)",
          padding: "4px 8px",
          borderRadius: "2px",
        }}
      >
        {details}
      </div>
    )}
  </div>
);

/**
 * 블록 렌더러 팩토리 컴포넌트
 *
 * 블록 타입과 렌더링 영역에 따라 적절한 렌더러 컴포넌트를 반환합니다.
 */
export const BlockRenderer: React.FC<BlockRendererProps> = ({
  block,
  area,
  journeyId,
}) => {
  // 블록 타입과 영역에 따라 적절한 렌더러 선택
  switch (block.type) {
    case BlockType.JOURNEY:
      if (area === RenderingArea.SIDEBAR) {
        return <JourneyBlockSidebarRenderer block={block} />;
      } else {
        return (
          <RenderError message="Journey 블록은 SIDEBAR 영역에서만 랜더링 될 수 있습니다." />
        );
      }

    case BlockType.STEP_GROUP:
      if (area === RenderingArea.SIDEBAR) {
        return <StepGroupBlockSidebarRenderer block={block} />;
      } else if (area === RenderingArea.CONTENT) {
        console.error(
          `StepGroup block should not be rendered in CONTENT area: ${block.id}`,
        );
        return (
          <RenderError message="StepGroup 블록은 Content 영역에서 직접 렌더링될 수 없습니다." />
        );
      }
      break;

    case BlockType.STEP:
      if (area === RenderingArea.SIDEBAR) {
        return <StepBlockSidebarRenderer block={block} />;
      } else if (area === RenderingArea.CONTENT) {
        if (!journeyId) {
          console.error("journeyId is required for rendering Step content");
          return (
            <RenderError message="Step 블록을 렌더링하려면 Journey ID가 필요합니다." />
          );
        }
        return (
          <StepBlockJourneyContentRenderer
            block={block}
            journeyId={journeyId}
          />
        );
      }
      break;
  }

  // 지원하지 않는 블록 타입이나 영역인 경우
  return (
    <RenderError
      message={`지원되지 않는 블록 타입 또는 영역입니다: ${block.type} / ${area}`}
    />
  );
};
