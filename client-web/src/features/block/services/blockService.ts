import dbClient from "@/services/dbClient";
import {
  Block,
  BlockType,
  isJourneyBlock,
  JourneyBlock,
  StepBlock,
} from "../types";
import { Block as BlockNoteBlock } from "@blocknote/core";
import { filterAndSortStepBlocks } from "../utils/blockUtils";
import { prepareBlocksForSaving } from "../utils/blockNoteConverter";
import { generateBlockId } from "@/features/block/utils/blockUtils";

/**
 * 특정 ID의 Journey 블록을 조회
 *
 * @param id - 조회할 Journey 블록의 ID
 * @returns {Promise<JourneyBlock>} 조회된 Journey 블록
 * @throws 블록을 찾을 수 없거나 Journey 타입이 아닌 경우 에러 발생
 */
export const fetchJourneyBlockById = async (
  id: string,
): Promise<JourneyBlock> => {
  const block = await dbClient.blocks.get(id);

  if (!block) {
    throw new Error(`Block with id ${id} not found`);
  }
  if (!isJourneyBlock(block)) {
    throw new Error(
      `Block with id ${id} is not a Journey block (found type: ${block.type})`,
    );
  }

  return block;
};

/**
 * 특정 Journey 블록과 그 모든 하위 블록들을 단일 배열로 조회
 *
 * @param journeyId - 조회할 Journey의 ID
 * @returns {Promise<Block[]>} Journey 블록을 포함한 모든 하위 블록들의 평면화된 배열
 * @throws Journey 블록을 찾을 수 없거나 타입이 맞지 않는 경우 에러 발생
 */
export const fetchJourneyWithDescendants = async (
  journeyId: string,
): Promise<Block[]> => {
  const journeyBlock = await fetchJourneyBlockById(journeyId);

  // journey 블록과 그 모든 하위 블록을 수집할 배열
  const allBlocks: Block[] = [];

  // 배열에 먼저 journey 블록을 추가
  allBlocks.push(journeyBlock);

  // journey 블록의 하위 블록 트리 순회하여 배열에 추가
  await fetchChildBlocksRecursively(journeyId, allBlocks);

  return allBlocks;
};

/**
 * 재귀적으로 모든 자식 블록들을 조회하여 결과 배열에 추가
 */
async function fetchChildBlocksRecursively(
  blockId: string,
  results: Block[],
): Promise<void> {
  // 해당 블록의 모든 자식 블록 가져오기
  const children = await dbClient.blocks
    .where("parentId")
    .equals(blockId)
    .toArray();

  // 결과에 자식들 추가
  results.push(...children);

  // 각 자식에 대해 재귀적으로 자식의 자식 가져오기
  for (const child of children) {
    if (child.childrenIds && child.childrenIds.length > 0) {
      await fetchChildBlocksRecursively(child.id, results);
    }
  }
}

/**
 * 모든 Journey 타입 블록을 조회
 *
 * @returns {Promise<JourneyBlock[]>} 모든 Journey 블록의 배열
 */
export const fetchAllJourneyBlocks = async (): Promise<JourneyBlock[]> => {
  const blocks = await dbClient.blocks
    .where("type") // todo DB 필드 상수로 관리
    .equals(BlockType.JOURNEY)
    .toArray();

  // 타입 가드로 필터링 후 반환
  return blocks.filter(isJourneyBlock) as JourneyBlock[];
};

// Journey와 그 단계들 로드
export const fetchJourneyAndOrderedSteps = async (
  id: string,
): Promise<{
  journeyBlock: JourneyBlock | null;
  flattenedSteps: StepBlock[];
  allBlocks: Block[];
}> => {
  // DB에서 Journey와 하위 블록 조회
  const allBlocksInJourney = await fetchJourneyWithDescendants(id);
  let journeyBlock = allBlocksInJourney.find(
    (block) => block.id === id && isJourneyBlock(block),
  ) as JourneyBlock | undefined;

  // Journey 블록이 없는 경우 에러 발생
  if (!journeyBlock) {
    throw new Error(`Journey with id ${id} not found`);
  }

  const sortedStepBlocks = filterAndSortStepBlocks(allBlocksInJourney);
  return {
    journeyBlock,
    flattenedSteps: sortedStepBlocks,
    allBlocks: allBlocksInJourney,
  };
};

// 데이터베이스 초기화
export const initializeBlocksDatabase = async (): Promise<void> => {
  // 이미 데이터가 있는지 확인
  const count = await dbClient.blocks.count();
  if (count > 0) {
    return;
  }

  console.log("Database initialized");
};

/**
 * 새로운 블록을 생성하여 데이터베이스에 저장
 *
 * @param partialBlock 생성할 블록의 부분 정보
 * @returns 생성된 블록의 ID
 * @throws 필수 속성인 type 이 누락된 경우 에러 발생
 */
export const createBlock = async (
  partialBlock: Partial<Block>,
): Promise<string> => {
  // 필수 속성 검증
  if (!partialBlock.type) {
    throw new Error("Block type is required for block creation");
  }

  // ID가 없으면 블록 ID 생성
  const id = partialBlock.id || generateBlockId();
  const now = new Date().toISOString();

  // 타입 안전한 블록 생성
  const newBlock: Block = {
    ...(partialBlock as any), // 기존 속성 유지
    id,
    createdAt: now,
    updatedAt: now,
    // 기본 속성이 없는 경우 빈 값 추가
    childrenIds: partialBlock.childrenIds || [],
    properties: partialBlock.properties || {},
    type: partialBlock.type,
  };

  await dbClient.blocks.put(newBlock);
  return id;
};

// 블록 업데이트
export const updateBlock = async (
  partialBlock: Partial<Block> & { id: string },
): Promise<void> => {
  // 1. 현재 블록을 먼저 조회하여 존재하는지 확인
  const existing = await dbClient.blocks.get(partialBlock.id);
  if (!existing) {
    console.error(`Block with id ${partialBlock.id} not found`);
    throw new Error(`Block with id ${partialBlock.id} not found`);
  }

  try {
    // 2. 트랜잭션 내에서 업데이트 실행
    await dbClient.transaction("rw", dbClient.blocks, async () => {
      // 깊은 병합을 통해 기존 블록과 부분 블록 통합
      const updatedBlock = {
        ...existing,
        ...partialBlock,
        properties: {
          ...existing.properties,
          ...(partialBlock.properties || {}),
        },
        updatedAt: new Date().toISOString(),
      } as Block; // 단순히 Block으로 타입 단언

      // DB에 저장
      await dbClient.blocks.put(updatedBlock);
      console.log("Block updated successfully:", updatedBlock);
    });
  } catch (error) {
    console.error("BlockService updateBlock error:", error);
    throw error;
  }
};

// 블록 삭제
export const deleteBlock = async (id: string): Promise<void> => {
  await dbClient.blocks.delete(id);
};

// 재귀적으로 블록과 모든 자식 블록 삭제
export const deleteBlockTree = async (id: string): Promise<void> => {
  const block = await dbClient.blocks.get(id);
  if (!block) return;

  // 모든 자식 블록을 재귀적으로 삭제
  for (const childId of block.childrenIds) {
    await deleteBlockTree(childId);
  }

  // 현재 블록 삭제
  await deleteBlock(id);
};

/**
 * BlockNote 에디터의 콘텐츠를 커스텀 블록으로 변환하여 저장
 * @param stepBlock 스텝 블록
 * @param blockNoteBlocks BlockNote 에디터의 블록 배열
 */
export async function convertAndSaveBlockNoteContent(
  stepBlock: StepBlock,
  blockNoteBlocks: BlockNoteBlock[],
): Promise<void> {
  // 기존 자식 블록들 삭제 (트리 단위로 삭제)
  for (const childId of stepBlock.childrenIds) {
    await deleteBlockTree(childId);
  }

  // BlockNote 콘텐츠를 커스텀 블록으로 변환
  const customBlocks = await prepareBlocksForSaving(
    blockNoteBlocks,
    stepBlock.id,
    stepBlock.createdBy,
  );

  // 최상위 블록 ID 추출하여 스텝 블록의 자식으로 설정
  const topLevelBlockIds = customBlocks
    .filter((block) => block.parentId === stepBlock.id)
    .map((block) => block.id);

  // 스텝 블록 업데이트
  const updatedStepBlock: StepBlock = {
    ...stepBlock,
    childrenIds: topLevelBlockIds,
    updatedAt: new Date().toISOString(),
  };

  // 트랜잭션으로 모든 변경사항 한번에 저장
  await dbClient.transaction("rw", dbClient.blocks, async () => {
    // 1. 스텝 블록 업데이트
    await dbClient.blocks.put(updatedStepBlock);

    // 2. 모든 콘텐츠 블록 저장
    for (const block of customBlocks) {
      await dbClient.blocks.put(block);
    }
  });
}
