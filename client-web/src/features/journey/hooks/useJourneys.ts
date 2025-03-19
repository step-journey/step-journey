import { useQuery, UseQueryResult } from "@tanstack/react-query";
import {
  fetchAllJourneyBlocks,
  fetchJourneyAndOrderedSteps,
  initializeBlocksDatabase,
} from "@/features/block/services/blockService";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { useState } from "react";
import { JourneyData } from "@/features/journey/types/serviceTypes";
import { JourneyBlock } from "@/features/block/types";

// 모든 journey block 들을 조회
export function useJourneys(): UseQueryResult<JourneyBlock[]> {
  const [initialized, setInitialized] = useState(false);

  return useQuery<JourneyBlock[]>({
    queryKey: QUERY_KEYS.journeys.all,
    queryFn: async () => {
      if (!initialized) {
        await initializeBlocksDatabase();
        setInitialized(true);
      }
      return fetchAllJourneyBlocks();
    },
    staleTime: 5 * 60 * 1000, // 5분
  });
}

// 특정 journey block 과 그 하위의 모든 block 조회
export function useJourney(journeyId: string): UseQueryResult<JourneyData> {
  return useQuery<JourneyData>({
    queryKey: QUERY_KEYS.journeys.detail(journeyId),
    queryFn: async () => {
      if (import.meta.env.DEV) {
        console.log(
          `Loading journey data for: ${journeyId}`,
          new Date().toISOString(),
        );
      }
      return fetchJourneyAndOrderedSteps(journeyId);
    },
    staleTime: 30 * 1000, // 30초 동안 신선한 상태 유지
    refetchOnWindowFocus: false, // 창 포커스 시 자동 리패치 비활성화
    gcTime: 10 * 60 * 1000, // 10분간 캐시 유지
  });
}
