/**
 * 블록 관계 및 변환을 위한 유틸리티 함수
 */

import { BlockType, RawJsonBlock, Block } from "../types/base";
import { JourneyBlock, isJourneyBlock } from "../types/journey";
import { StepGroupBlock } from "../types/stepGroup";
import { FlattenedBlock, StepBlock } from "../types/step";
import { blocks } from "@/assets/data"; // 정적 블록 데이터 import 추가

/**
 * 원시 JSON 블록을 타입이 지정된 Block 으로 변환
 * @param rawBlock 블록의 JSON 표현
 * @returns 타입이 지정된 Block 인스턴스
 */
export function rawJsonToBlock(rawBlock: RawJsonBlock): Block {
  // 공통 필드가 있는 기본 블록 생성
  const baseBlock = {
    id: rawBlock.id,
    type:
      rawBlock.type === "journey"
        ? BlockType.JOURNEY
        : rawBlock.type === "step_group"
          ? BlockType.STEP_GROUP
          : BlockType.STEP,
    parentId: rawBlock.parentId,
    content: Array.isArray(rawBlock.content) ? rawBlock.content : [],
    createdAt: rawBlock.createdAt || new Date().toISOString(),
    updatedAt: rawBlock.updatedAt || new Date().toISOString(),
    createdBy: rawBlock.createdBy || "system",
  };

  // type 필드에 따라 특정 블록 타입 생성
  switch (baseBlock.type) {
    case BlockType.JOURNEY:
      return {
        ...baseBlock,
        type: BlockType.JOURNEY,
        properties: {
          title: rawBlock.properties.title,
          description: rawBlock.properties.description,
          pinnedProblem: rawBlock.properties.pinnedProblem
            ? {
                text: rawBlock.properties.pinnedProblem.text || "",
              }
            : undefined,
        },
      };

    case BlockType.STEP_GROUP:
      return {
        ...baseBlock,
        type: BlockType.STEP_GROUP,
        properties: {
          title: rawBlock.properties.title,
          description: rawBlock.properties.description,
          groupLabel: rawBlock.properties.groupLabel,
        },
      };

    case BlockType.STEP:
      return {
        ...baseBlock,
        type: BlockType.STEP,
        properties: {
          title: rawBlock.properties.title,
          description: rawBlock.properties.description,
          label: rawBlock.properties.label,
          desc: rawBlock.properties.desc,
          content: rawBlock.properties.content,
          stepIdInGroup: rawBlock.properties.stepIdInGroup,
          highlightedKeywordsInProblem:
            rawBlock.properties.highlightedKeywordsInProblem,
        },
      };

    default:
      throw new Error(`알 수 없는 블록 타입: ${rawBlock.type}`);
  }
}

/**
 * 부모 블록의 모든 자식 블록 가져오기
 * @param parentBlock 부모 블록
 * @param allBlocks 사용 가능한 모든 블록 배열
 * @returns 자식 블록 배열
 */
export function getChildBlocks(
  parentBlock: Block,
  allBlocks: Block[],
): Block[] {
  return parentBlock.content
    .map((id) => allBlocks.find((block) => block.id === id))
    .filter(Boolean) as Block[];
}

/**
 * 특정 타입의 자식 블록 가져오기
 * @param parentBlock 부모 블록
 * @param allBlocks 사용 가능한 모든 블록 배열
 * @param type 필터링할 블록 타입
 * @returns 지정된 타입의 자식 블록 배열
 */
export function getChildBlocksByType<T extends Block>(
  parentBlock: Block,
  allBlocks: Block[],
  type: BlockType,
): T[] {
  return getChildBlocks(parentBlock, allBlocks).filter(
    (block) => block.type === type,
  ) as T[];
}

/**
 * 블록 계층 구조의 평면화된 표현 생성
 * @param journeyBlock 최상위 Journey 블록
 * @param allBlocks 사용 가능한 모든 블록 배열
 * @returns 전역 인덱스가 있는 평면화된 단계 블록 배열
 */
export function flattenBlocks(
  journeyBlock: Block,
  allBlocks: Block[],
): FlattenedBlock[] {
  if (!isJourneyBlock(journeyBlock)) {
    throw new Error("Journey 블록이 아닙니다");
  }

  const result: FlattenedBlock[] = [];
  let globalIndex = 0;

  // StepGroup 블록 가져오기
  const stepGroupBlocks = getChildBlocksByType<StepGroupBlock>(
    journeyBlock,
    allBlocks,
    BlockType.STEP_GROUP,
  );

  // 각 StepGroup 에 대해 Step 블록 가져오기
  stepGroupBlocks.forEach((groupBlock) => {
    const stepBlocks = getChildBlocksByType<StepBlock>(
      groupBlock,
      allBlocks,
      BlockType.STEP,
    );

    // 각 Step 을 globalIndex 와 함께 결과에 추가
    stepBlocks.forEach((stepBlock) => {
      const flatBlock: FlattenedBlock = {
        ...stepBlock,
        globalIndex,
      };

      result.push(flatBlock);
      globalIndex++;
    });
  });

  return result;
}

/**
 * 모든 블록 타입의 제목/레이블을 가져오는 다형적 함수
 * @param block 모든 블록 타입
 * @returns 대체 값이 있는 적절한 제목 또는 레이블
 */
export function getBlockTitle(block: Block): string {
  if (isJourneyBlock(block)) {
    return block.properties.title || "제목 없는 Journey";
  } else if (block.type === BlockType.STEP_GROUP) {
    return (
      block.properties.title || block.properties.groupLabel || "제목 없는 그룹"
    );
  } else if (block.type === BlockType.STEP) {
    return block.properties.title || block.properties.label || "제목 없는 단계";
  }

  return "제목 없는 블록";
}

/**
 * ID로 특정 Journey 블록 찾기
 * @param id 찾을 Journey 의 ID
 * @returns Journey 블록 또는 undefined
 */
export const getJourneyById = (id: string): JourneyBlock | undefined => {
  const block = blocks.find(
    (block) => block.id === id && block.type === BlockType.JOURNEY,
  );

  return isJourneyBlock(block) ? block : undefined;
};

/**
 * 특정 블록과 모든 관련 자식 블록들 가져오기
 * @param id 블록 ID
 * @returns 블록과 모든 자식 블록들의 배열
 */
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
