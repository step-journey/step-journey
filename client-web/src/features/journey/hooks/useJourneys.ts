import { useQuery } from "@tanstack/react-query";
import {
  getAllJourneyBlocks,
  loadJourneyWithSteps,
  initializeDatabase,
} from "@/features/block/services/blockService";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { useEffect, useState } from "react";
import {
  Block,
  BlockType,
  StepBlock,
  JourneyBlock,
} from "@/features/block/types";
import { useBlockRenderer } from "@/features/block/hooks/useBlockRenderer";
import { useBlockData } from "@/features/block/hooks/useBlockData";

// 여정 데이터 반환 타입 정의
type JourneyData = {
  journeyBlock: JourneyBlock | null;
  flattenedSteps: StepBlock[];
  allBlocks: Block[];
};

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
      return getAllJourneyBlocks();
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

  // journeyId가 변경될 때 스텝 인덱스 초기화
  useEffect(() => {
    setCurrentStepIndex(0);
  }, [journeyId]);

  const journeyQuery = useQuery<JourneyData>({
    queryKey: QUERY_KEYS.journeys.detail(journeyId || ""),
    queryFn: async () => {
      if (!journeyId)
        return { journeyBlock: null, flattenedSteps: [], allBlocks: [] };

      console.log(`Loading journey data for: ${journeyId}`);
      return loadJourneyWithSteps(journeyId);
    },
    enabled: !!journeyId,
    staleTime: 0, // 항상 stale로 간주하여 데이터 요청 시 refetch (수정)
    refetchOnWindowFocus: true, // 윈도우 포커스 시 자동 리패치 활성화
    gcTime: 2 * 60 * 1000,
  });

  // 블록 데이터 활용 - 타입 안전하게 처리
  const allBlocks = journeyQuery.data?.allBlocks || [];
  const blockData = useBlockData(allBlocks);

  // 여정 ID가 있는 경우 블록 렌더러 사용
  const blockRenderer = useBlockRenderer(
    journeyId || "",
    allBlocks,
    journeyQuery.data?.flattenedSteps || [],
    currentStepIndex,
  );

  // 스텝 인덱스 변경 함수
  const nextStep = () => {
    if (!journeyQuery.data) return;
    const flattenedSteps = journeyQuery.data.flattenedSteps;
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

  // 스텝 그룹 블록 가져오기 (기존 메서드 대신 블록 데이터 훅 활용)
  const getStepGroups = () => {
    if (!journeyQuery.data?.journeyBlock?.id) return [];

    return blockData.getChildBlocksByType(
      journeyQuery.data.journeyBlock.id,
      BlockType.STEP_GROUP,
    );
  };

  return {
    ...journeyQuery,
    ...blockRenderer, // 렌더러 결과도 포함하여 내보냄
    blockData, // 블록 데이터 접근 메서드 제공
    currentStepIndex,
    setCurrentStepIndex,
    nextStep,
    prevStep,
    expandedGroups,
    toggleGroup,
    getStepGroups,
  };
}
