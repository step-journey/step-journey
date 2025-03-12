import db from "./db";
import { Journey } from "@/types/journey";

// Journey 조회 기능
export const getJourney = async (id: string): Promise<Journey | undefined> => {
  return db.journeys.get(id);
};

export const getAllJourneys = async (): Promise<Journey[]> => {
  return db.journeys.toArray();
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
