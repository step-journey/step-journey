import { v4 as uuidv4 } from "uuid";
import db from "./db";
import { Journey } from "@/types/journey";

// Journey CRUD 기능
export const createJourney = async (
  journey: Partial<Journey>,
): Promise<string> => {
  const now = new Date().toISOString();
  const id = journey.id || uuidv4();

  const newJourney: Journey = {
    id,
    title: journey.title || "Untitled Journey",
    description: journey.description || "",
    step_order: journey.step_order || [],
    created_at: now,
    updated_at: now,
    groups: journey.groups || [],
    pinnedProblem: journey.pinnedProblem || "",
  };

  await db.journeys.add(newJourney);
  return id;
};

export const getJourney = async (id: string): Promise<Journey | undefined> => {
  return db.journeys.get(id);
};

export const getAllJourneys = async (): Promise<Journey[]> => {
  return db.journeys.toArray();
};

export const updateJourney = async (
  id: string,
  journeyData: Partial<Journey>,
): Promise<void> => {
  const now = new Date().toISOString();
  const journey = await db.journeys.get(id);

  if (!journey) {
    throw new Error(`Journey with id ${id} not found`);
  }

  await db.journeys.update(id, {
    ...journeyData,
    updated_at: now,
  });
};

export const deleteJourney = async (id: string): Promise<void> => {
  // 연결된 Step들 삭제
  const steps = await db.steps.where("journey_id").equals(id).toArray();
  const stepIds = steps.map((step) => step.id);

  // Step에 연결된 Block들 삭제
  for (const stepId of stepIds) {
    await deleteBlocksByParentId(stepId);
  }

  // Step들 삭제
  await db.steps.bulkDelete(stepIds);

  // Journey 삭제
  await db.journeys.delete(id);
};

// Block 관련 기능
export const deleteBlocksByParentId = async (
  parentId: string,
): Promise<void> => {
  const blocks = await db.blocks.where("parent_id").equals(parentId).toArray();
  const blockIds = blocks.map((block) => block.id);

  await db.blocks.bulkDelete(blockIds);
};

// 데이터 초기화
export const initializeDatabase = async (): Promise<void> => {
  const count = await db.journeys.count();

  // 이미 데이터가 있으면 초기화 스킵
  if (count > 0) {
    return;
  }

  // 여기서 기본 데이터 추가 로직이 들어갈 수 있음
  console.log("Database initialized");
};
