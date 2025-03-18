/**
 * 블록 관계 및 변환을 위한 유틸리티 함수
 */
import { BlockType, Block, StepBlock } from "../types";
import { isJourneyBlock } from "../types";
import { StepGroupBlock } from "../types";
import { v4 as uuidv4 } from "uuid";

/**
 * 블록 ID 생성 함수
 * @returns 생성된 고유 ID
 */
export function generateBlockId(): string {
  return uuidv4();
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
  return parentBlock.childrenIds
    .map((id: string) => allBlocks.find((block) => block.id === id))
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
 * @returns 전역 인덱스가 포함된 평면화된 단계 블록 배열
 */
export function flattenBlocks(
  journeyBlock: Block,
  allBlocks: Block[],
): StepBlock[] {
  if (!isJourneyBlock(journeyBlock)) {
    throw new Error("Journey 블록이 아닙니다");
  }

  const result: StepBlock[] = [];
  let order = 0;

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

    // 각 Step 에 order 속성 추가하여 결과에 추가
    stepBlocks.forEach((stepBlock) => {
      const blockWithOrder: StepBlock = {
        ...stepBlock,
        properties: {
          ...stepBlock.properties,
          order: order,
        },
      };

      result.push(blockWithOrder);
      order++;
    });
  });

  return result;
}

/**
 * 기본 문단 블록 생성
 *
 * @param parentId 부모 블록 ID
 * @returns 기본 문단 블록 객체
 */
export function createDefaultParagraphBlock(parentId: string): Block {
  const id = generateBlockId();
  const now = new Date().toISOString();

  return {
    id,
    type: BlockType.PARAGRAPH,
    parentId,
    childrenIds: [],
    createdBy: "user",
    createdAt: now,
    updatedAt: now,
    properties: {
      textColor: "default",
      backgroundColor: "default",
      textAlignment: "left",
    },
    content: [
      {
        type: "text",
        text: "내용을 입력하세요...",
        styles: {},
      },
    ],
  };
}
