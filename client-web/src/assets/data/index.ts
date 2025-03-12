import cubicProblemJourneyData from "./cubic-problem-journey.json";
import { Block, RawJsonBlock, isJourneyBlock } from "@/features/journey/types";
import cubicProblemImage from "../images/cubic-problem.png";
import { rawJsonToBlock } from "@/features/journey/utils/blockUtils";

// 정적 블록 데이터 - 블록 기반 데이터 모델
export const blocks: Block[] = (
  (cubicProblemJourneyData as any).blocks as RawJsonBlock[]
).map((rawBlock): Block => {
  const block = rawJsonToBlock(rawBlock);

  // Journey 블록인 경우 이미지 추가
  if (
    isJourneyBlock(block) &&
    block.id === "cubic-problem" &&
    block.properties.pinnedProblem
  ) {
    return {
      ...block,
      properties: {
        ...block.properties,
        pinnedProblem: {
          ...block.properties.pinnedProblem,
          media: {
            type: "image",
            url: cubicProblemImage,
            alt: "삼차함수 그래프 문제",
            caption: "",
          },
        },
      },
    } as Block;
  }

  return block;
});
