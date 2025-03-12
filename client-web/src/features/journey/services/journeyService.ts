import dbClient from "@/services/dbClient";
import { Journey, FlattenedStep } from "@/features/journey/types/journey";
import { getJourneyById, flattenJourneySteps } from "@/assets/data";

// Journey 조회 기능
export const getJourney = async (id: string): Promise<Journey | undefined> => {
  return dbClient.journeys.get(id);
};

export const getAllJourneys = async (): Promise<Journey[]> => {
  return dbClient.journeys.toArray();
};

// 정적 데이터와 DB 데이터 병합
export const getCombinedJourneys = async (): Promise<Journey[]> => {
  const dbJourneys = await getAllJourneys();

  // 정적 데이터 불러오기
  const staticJourneys = await import("@/assets/data").then(
    (module) => module.journeys,
  );

  const combinedJourneys = [...dbJourneys];

  // 정적 데이터 중 DB에 없는 것만 추가
  for (const staticJourney of staticJourneys) {
    if (!dbJourneys.some((dbJourney) => dbJourney.id === staticJourney.id)) {
      combinedJourneys.push(staticJourney);
    }
  }

  return combinedJourneys;
};

// Journey와 그 단계들 로드
export const loadJourneyWithSteps = async (
  id: string,
): Promise<{
  journey: Journey | null;
  flattenedSteps: FlattenedStep[];
}> => {
  // DB 및 정적 데이터에서 Journey 찾기
  let journey = await getJourney(id);
  if (!journey) {
    journey = getJourneyById(id);
  }

  if (!journey) {
    return { journey: null, flattenedSteps: [] };
  }

  // 단계 평탄화
  const flattenedSteps = flattenJourneySteps(journey);

  return { journey, flattenedSteps };
};

// 데이터 초기화
export const initializeDatabase = async (): Promise<void> => {
  const count = await dbClient.journeys.count();

  // 이미 데이터가 있으면 초기화 스킵
  if (count > 0) {
    return;
  }

  // 여기서 기본 데이터 추가 로직이 들어갈 수 있음
  console.log("Database initialized");
};
