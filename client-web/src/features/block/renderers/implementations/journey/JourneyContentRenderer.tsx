import React from "react";
import { JourneyBlock, isJourneyBlock } from "../../../types";

interface JourneyContentRendererProps {
  block: JourneyBlock;
}

/**
 * Journey 블록의 콘텐츠 렌더러
 */
export const JourneyContentRenderer: React.FC<JourneyContentRendererProps> = ({
  block,
}) => {
  // 타입 가드
  if (!isJourneyBlock(block)) {
    return <div>Invalid journey block</div>;
  }

  // this component no longer renders anything
  return null;
};
