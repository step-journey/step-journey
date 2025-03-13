import dbClient from "@/services/dbClient";
import {
  Block,
  BlockType,
  FlattenedBlock,
  isJourneyBlock,
  JourneyBlock,
  StepGroupBlock,
  StepBlock,
} from "../types";
import { flattenBlocks } from "../utils/blockUtils";

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

  // Journey 블록의 모든 자식 블록(StepGroup)과 손자 블록(Step) 가져오기
  const relatedBlocks: Block[] = [journeyBlock];

  // StepGroup 블록 가져오기
  const stepGroupBlocks = (await dbClient.blocks
    .where("parentId")
    .equals(journeyId)
    .and((item) => item.type === BlockType.STEP_GROUP)
    .toArray()) as StepGroupBlock[];

  relatedBlocks.push(...stepGroupBlocks);

  // 각 StepGroup의 Step 블록 가져오기
  for (const groupBlock of stepGroupBlocks) {
    const stepBlocks = (await dbClient.blocks
      .where("parentId")
      .equals(groupBlock.id)
      .and((item) => item.type === BlockType.STEP)
      .toArray()) as StepBlock[];

    relatedBlocks.push(...stepBlocks);
  }

  return relatedBlocks;
};

// 모든 Journey 블록 조회
export const getAllJourneyBlocks = async (): Promise<JourneyBlock[]> => {
  const blocks = await dbClient.blocks
    .where("type")
    .equals(BlockType.JOURNEY)
    .toArray();

  return blocks.filter(isJourneyBlock) as JourneyBlock[];
};

// DB에서 여정 조회
export const getCombinedJourneys = async (): Promise<JourneyBlock[]> => {
  const dbJourneys = await getAllJourneyBlocks();
  return dbJourneys;
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
  const id = partialBlock.id || crypto.randomUUID();
  const now = new Date().toISOString();

  // 타입 안전한 블록 생성
  const newBlock: Block = {
    ...(partialBlock as any), // 기존 속성 유지
    id,
    createdAt: now,
    updatedAt: now,
    // 기본 속성이 없는 경우 빈 값 추가
    content: partialBlock.content || [],
    properties: partialBlock.properties || {},
    type: partialBlock.type || BlockType.STEP, // 기본 타입 설정
  };

  await dbClient.blocks.put(newBlock);
  return id;
};

// 블록 업데이트
export const updateBlock = async (block: Block): Promise<void> => {
  const existing = await dbClient.blocks.get(block.id);
  if (!existing) {
    throw new Error(`Block with id ${block.id} not found`);
  }

  const updatedBlock = {
    ...block,
    updatedAt: new Date().toISOString(),
  };

  await dbClient.blocks.put(updatedBlock);
};

// 블록 삭제
export const deleteBlock = async (id: string): Promise<void> => {
  await dbClient.blocks.delete(id);
};

// 블록 순서 변경
export const reorderBlocks = async (
  parentId: string,
  orderedIds: string[],
): Promise<void> => {
  const parentBlock = await dbClient.blocks.get(parentId);
  if (!parentBlock) {
    throw new Error(`Parent block with id ${parentId} not found`);
  }

  // 부모 블록 content 필드 업데이트
  const updatedParent = {
    ...parentBlock,
    content: orderedIds,
    updatedAt: new Date().toISOString(),
  };

  await dbClient.blocks.put(updatedParent);
};

// 여정 복제
export const duplicateJourney = async (
  journeyId: string,
): Promise<string | null> => {
  try {
    // 여정과 관련 블록 가져오기
    const blocks = await getJourneyWithRelatedBlocks(journeyId);
    if (blocks.length === 0) return null;

    // ID 매핑 (기존 ID -> 새 ID)
    const idMap: Record<string, string> = {};

    // 새 ID 생성 및 매핑
    blocks.forEach((block) => {
      idMap[block.id] = crypto.randomUUID();
    });

    // 복제된 블록 생성 및 저장
    for (const block of blocks) {
      const newId = idMap[block.id];
      const newParentId = block.parentId ? idMap[block.parentId] : undefined;
      const newContent = block.content.map((id) => idMap[id] || id);

      const newBlock = {
        ...block,
        id: newId,
        parentId: newParentId,
        content: newContent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: "user", // 또는 현재 사용자 ID
      };

      // Journey 블록인 경우 제목 변경
      if (block.type === BlockType.JOURNEY) {
        newBlock.properties = {
          ...block.properties,
          title: `${block.properties.title || "Untitled"} (복사본)`,
        };
      }

      await dbClient.blocks.put(newBlock);
    }

    return idMap[journeyId];
  } catch (error) {
    console.error("Failed to duplicate journey:", error);
    return null;
  }
};
