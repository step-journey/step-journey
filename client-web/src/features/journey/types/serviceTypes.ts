import { Block, JourneyBlock, StepBlock } from "@/features/block/types";

/**
 * Journey 블로과 그 하위 블록들을 포함한 데이터 타입
 */
export interface JourneyData {
  journeyBlock: JourneyBlock | null;
  sortedStepBlocks: StepBlock[];
  allBlocks: Block[];
}
