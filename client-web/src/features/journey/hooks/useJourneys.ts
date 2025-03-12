import { useQuery } from "@tanstack/react-query";
import {
  getCombinedJourneys,
  loadJourneyWithSteps,
  initializeDatabase,
} from "@/features/journey/services/journeyService";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { useState } from "react";
import { Block, BlockType } from "../types/block";

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
      if (!journeyId)
        return { journeyBlock: null, flattenedSteps: [], allBlocks: [] };
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

  // 스탭 그룹 블록 가져오기
  const getStepGroups = () => {
    if (!journeyQuery.data?.journeyBlock || !journeyQuery.data.allBlocks)
      return [];

    return journeyQuery.data.journeyBlock.content
      .map((id) => journeyQuery.data.allBlocks.find((block) => block.id === id))
      .filter(
        (block) => block && block.type === BlockType.STEP_GROUP,
      ) as Block[];
  };

  return {
    ...journeyQuery,
    currentStepIndex,
    setCurrentStepIndex,
    nextStep,
    prevStep,
    expandedGroups,
    toggleGroup,
    getStepGroups,
  };
}
