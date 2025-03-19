import { useQuery } from "@tanstack/react-query";
import {
  fetchAllJourneyBlocks,
  fetchJourneyAndOrderedSteps,
  initializeBlocksDatabase,
} from "@/features/block/services/blockService";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { useEffect, useState } from "react";
import { BlockType } from "@/features/block/types";
import { useBlockRenderer } from "@/features/block/hooks/useBlockRenderer";
import { useBlockData } from "@/features/block/hooks/useBlockData";
import { JourneyData } from "@/features/journey/types/serviceTypes";

// 여정 목록을 조회하는 훅
export function useJourneys() {
  const [initialized, setInitialized] = useState(false);

  return useQuery({
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

// 특정 여정과 그 단계들을 조회하는 훅
export function useJourney(journeyId: string | undefined) {
  const [currentStepOrder, setCurrentStepOrder] = useState(0);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {},
  );

  // journeyId가 변경될 때 스텝 인덱스 초기화
  useEffect(() => {
    setCurrentStepOrder(0);
  }, [journeyId]);

  const journeyQuery = useQuery<JourneyData>({
    queryKey: QUERY_KEYS.journeys.detail(journeyId || ""),
    queryFn: async () => {
      if (!journeyId) throw new Error("Journey ID is required");

      if (import.meta.env.DEV) {
        console.log(
          `Loading journey data for: ${journeyId}`,
          new Date().toISOString(),
        );
      }
      return fetchJourneyAndOrderedSteps(journeyId);
    },
    enabled: !!journeyId,
    staleTime: 30 * 1000, // 30초 동안 신선한 상태 유지
    refetchOnWindowFocus: false, // 창 포커스 시 자동 리패치 비활성화
    gcTime: 10 * 60 * 1000, // 10분간 캐시 유지
  });

  // 블록 데이터 활용 - 타입 안전하게 처리
  const allBlocks = journeyQuery.data?.allBlocks || [];
  const blockData = useBlockData(allBlocks);

  // 여정 ID가 있는 경우 블록 렌더러 사용
  const blockRenderer = useBlockRenderer(
    journeyId || "",
    allBlocks,
    journeyQuery.data?.sortedStepBlocks || [],
    currentStepOrder,
  );

  // 스텝 인덱스 변경 함수
  const nextStep = () => {
    if (!journeyQuery.data) return;
    const sortedStepBlocks = journeyQuery.data.sortedStepBlocks;
    const maxOrder = sortedStepBlocks.length - 1;
    setCurrentStepOrder((prev) => Math.min(prev + 1, maxOrder));
  };

  const prevStep = () => {
    setCurrentStepOrder((prev) => Math.max(0, prev - 1));
  };

  // 그룹 토글 함수
  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  // 스텝 그룹 블록 가져오기
  const getStepGroups = () => {
    if (!journeyQuery.data?.journeyBlock?.id) return [];

    return blockData.getChildBlocksByType(
      journeyQuery.data.journeyBlock.id,
      BlockType.STEP_GROUP,
    );
  };

  return {
    ...journeyQuery,
    ...blockRenderer,
    blockData,
    currentStepOrder: currentStepOrder,
    setCurrentStepOrder: setCurrentStepOrder,
    nextStep,
    prevStep,
    expandedGroups,
    toggleGroup,
    getStepGroups,
  };
}
