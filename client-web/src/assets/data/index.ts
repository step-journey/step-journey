import cubicProblemJourneyData from "./cubic-problem-journey.json";
import {
  Block,
  BlockType,
  RawJsonBlock,
  rawJsonToBlock,
  isJourneyBlock,
  JourneyBlock,
} from "@/features/journey/types/block";
import cubicProblemImage from "../images/cubic-problem.png";

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

// 특정 Journey 가져오기 (ID로)
export const getJourneyById = (id: string): JourneyBlock | undefined => {
  const block = blocks.find(
    (block) => block.id === id && block.type === BlockType.JOURNEY,
  );

  return isJourneyBlock(block) ? block : undefined;
};

// 특정 블록과 모든 관련 블록 가져오기
export const getBlockWithChildren = (id: string): Block[] => {
  const block = blocks.find((b) => b.id === id);
  if (!block) return [];

  const result: Block[] = [block];

  // 자식 블록들을 재귀적으로 추가
  const addChildren = (parentId: string) => {
    const children = blocks.filter((b) => b.parentId === parentId);
    result.push(...children);

    // 각 자식의 자식들도 추가
    children.forEach((child) => {
      addChildren(child.id);
    });
  };

  addChildren(id);
  return result;
};
