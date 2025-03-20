/**
 * 블록 관계 및 변환을 위한 유틸리티 함수
 */
import { BlockType, Block, StepBlock } from "../types";
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
 * 모든 Step 블록을 찾고 order 값에 따라 정렬
 *
 * @param allBlocks 모든 블록 배열
 * @returns order 값에 따라 정렬된 Step 블록 배열
 */
export function filterAndSortStepBlocks(allBlocks: Block[]): StepBlock[] {
  // 모든 블록에서 Step 타입인 것만 필터링
  const stepBlocks = allBlocks.filter(
    (block) => block.type === BlockType.STEP,
  ) as StepBlock[];

  // order 기준으로 정렬
  stepBlocks.sort((a, b) => {
    const orderA =
      typeof a.properties.order === "number" ? a.properties.order : 0;
    const orderB =
      typeof b.properties.order === "number" ? b.properties.order : 0;
    return orderA - orderB;
  });

  return stepBlocks;
}

/**
 * 기본 paragraph 블록 생성
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
        text: "",
        styles: {},
      },
    ],
  };
}
