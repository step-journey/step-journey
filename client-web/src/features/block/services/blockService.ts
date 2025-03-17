import dbClient from "@/services/dbClient";
import {
  Block,
  BlockType,
  FlattenedBlock,
  isJourneyBlock,
  JourneyBlock,
  StepBlock,
} from "../types";
import { Block as BlockNoteBlock } from "@blocknote/core";
import { flattenBlocks } from "../utils/blockUtils";
import { prepareBlocksForSaving } from "../utils/blockNoteConverter";
import { generateBlockId } from "@/features/block/utils/blockUtils";

// 특정 Journey 블록 조회
export const getJourneyBlock = async (
  id: string,
): Promise<JourneyBlock | undefined> => {
  const block = await dbClient.blocks.get(id);
  if (!block) return undefined;
  return isJourneyBlock(block) ? block : undefined;
};

// 특정 Journey 블록과 관련 모든 블록 조회
export const getJourneyWithRelatedBlocks = async (
  journeyId: string,
): Promise<Block[]> => {
  const journeyBlock = await getJourneyBlock(journeyId);
  if (!journeyBlock) return [];

  // Journey 블록 가져오기
  const allBlocks: Block[] = [journeyBlock];

  // Journey 블록의 하위 블록 트리 순회하기
  await fetchChildrenRecursively(journeyId, allBlocks);

  return allBlocks;
};

/**
 * 재귀적으로 모든 자식 블록 가져오기
 */
async function fetchChildrenRecursively(
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
      await fetchChildrenRecursively(child.id, results);
    }
  }
}

// 모든 Journey 블록 조회
export const getAllJourneyBlocks = async (): Promise<JourneyBlock[]> => {
  const blocks = await dbClient.blocks
    .where("type")
    .equals(BlockType.JOURNEY)
    .toArray();

  return blocks.filter(isJourneyBlock) as JourneyBlock[];
};

// Journey와 그 단계들 로드
export const loadJourneyWithSteps = async (
  id: string,
): Promise<{
  journeyBlock: JourneyBlock | null;
  flattenedSteps: FlattenedBlock[];
  allBlocks: Block[];
}> => {
  // DB에서 Journey와 관련 블록 조회
  const dbBlocks = await getJourneyWithRelatedBlocks(id);
  let journeyBlock = dbBlocks.find(
    (block) => block.id === id && isJourneyBlock(block),
  ) as JourneyBlock | undefined;

  // DB에 없는 경우
  if (!journeyBlock) {
    return { journeyBlock: null, flattenedSteps: [], allBlocks: [] };
  }

  // DB에서 찾은 경우
  const flattenedSteps = flattenBlocks(journeyBlock, dbBlocks);
  return { journeyBlock, flattenedSteps, allBlocks: dbBlocks };
};

// 데이터베이스 초기화 - 더 이상 정적 데이터를 사용하지 않음
export const initializeDatabase = async (): Promise<void> => {
  // 이미 데이터가 있는지 확인
  const count = await dbClient.blocks.count();
  if (count > 0) {
    return;
  }

  console.log("Database initialized");
};

// 블록 생성
export const createBlock = async (
  partialBlock: Partial<Block>,
): Promise<string> => {
  // ID가 없으면 블록 타입에 맞는 ID 생성
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
    type: partialBlock.type || BlockType.STEP, // 기본 타입 설정
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
export async function saveBlockNoteContent(
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
