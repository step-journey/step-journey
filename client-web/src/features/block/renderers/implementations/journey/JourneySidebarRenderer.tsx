import React from "react";
import { JourneyBlock, isJourneyBlock, getJourneyTitle } from "../../../types";
import { EditableJourneyTitle } from "../../../components/EditableJourneyTitle";

interface JourneySidebarRendererProps {
  block: JourneyBlock;
}

/**
 * Journey 블록의 사이드바 렌더러
 */
export const JourneySidebarRenderer: React.FC<JourneySidebarRendererProps> = ({
  block,
}) => {
  // 타입 가드
  if (!isJourneyBlock(block)) {
    return <div>Invalid journey block</div>;
  }

  return (
    <EditableJourneyTitle
      journeyId={block.id}
      value={getJourneyTitle(block)}
      className="text-base font-bold mb-3"
      placeholder="제목 없는 Journey"
    />
  );
};
