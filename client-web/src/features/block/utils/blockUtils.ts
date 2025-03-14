/**
 * 블록 관계 및 변환을 위한 유틸리티 함수
 */
import { BlockType, Block, BlockNoteBlock, StepBlock } from "../types";
import { isJourneyBlock } from "../types";
import { StepGroupBlock } from "../types";
import { FlattenedBlock } from "../types";

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
 * Step 블록에서 BlockNote 블록들을 가져오는 함수
 * @param block Step 블록
 * @returns BlockNote 블록 배열 (없는 경우 빈 배열)
 */
export function getBlockNoteBlocks(block: StepBlock): BlockNoteBlock[] {
  return block.properties.blockNoteBlocks || [];
}

/**
 * Step 블록에 BlockNote 블록들을 설정하는 함수
 * @param block 원본 Step 블록
 * @param blocks 설정할 BlockNote 블록 배열
 * @returns 업데이트된 새 Step 블록
 */
export function setBlockNoteBlocks(
  block: StepBlock,
  blocks: BlockNoteBlock[],
): StepBlock {
  return {
    ...block,
    properties: {
      ...block.properties,
      blockNoteBlocks: blocks,
    },
  };
}

/**
 * 기본 BlockNote 블록 배열을 생성하는 함수
 * @returns 기본 구성의 BlockNote 블록 배열
 */
export function createDefaultBlockNoteBlocks(): BlockNoteBlock[] {
  const defaultText = "내용을 입력하세요...";
  return [
    {
      id: crypto.randomUUID(),
      type: "paragraph",
      props: {
        textColor: "default",
        backgroundColor: "default",
        textAlignment: "left",
      },
      content: [
        {
          type: "text",
          text: defaultText,
          styles: {},
        },
      ],
      children: [],
    },
  ] as BlockNoteBlock[];
}
