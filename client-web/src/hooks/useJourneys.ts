import { useQuery } from "@tanstack/react-query";
import {
  getCombinedJourneys,
  loadJourneyWithSteps,
  initializeDatabase,
} from "@/services/journeyService";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { useState } from "react";

// 여정 목록을 조회하는 훅
export function useJourneys() {
  const [initialized, setInitialized] = useState(false);

  return useQuery({
    queryKey: QUERY_KEYS.journeys.all,
    queryFn: async () => {
      if (!initialized) {
        await initializeDatabase();
        setInitialized(true);
      }
      return getCombinedJourneys();
    },
    staleTime: 5 * 60 * 1000, // 5분
  });
}

// 특정 여정과 그 단계들을 조회하는 훅
export function useJourney(journeyId: string | undefined) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {},
  );

  const journeyQuery = useQuery({
    queryKey: QUERY_KEYS.journeys.detail(journeyId || ""),
    queryFn: async () => {
      if (!journeyId) return { journey: null, flattenedSteps: [] };
      return loadJourneyWithSteps(journeyId);
    },
    enabled: !!journeyId,
    staleTime: 5 * 60 * 1000, // 5분
  });

  // 스텝 인덱스 변경 함수
  const nextStep = () => {
    if (!journeyQuery.data) return;
    const { flattenedSteps } = journeyQuery.data;
    const maxIndex = flattenedSteps.length - 1;
    setCurrentStepIndex((prev) => Math.min(prev + 1, maxIndex));
  };

  const prevStep = () => {
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  };

  // 그룹 토글 함수
  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  return {
    ...journeyQuery,
    currentStepIndex,
    setCurrentStepIndex,
    nextStep,
    prevStep,
    expandedGroups,
    toggleGroup,
  };
}
