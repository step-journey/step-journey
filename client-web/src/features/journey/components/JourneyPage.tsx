import { useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "@blocknote/core/fonts/inter.css";
import { Block, StepContainerMap } from "@/features/block/types";
import { useQueryClient } from "@tanstack/react-query";

import { JourneySidebar } from "./JourneySidebar";
import { JourneyHeader } from "./JourneyHeader";
import { JourneyContent } from "./JourneyContent";
import { JourneyFooter } from "./JourneyFooter";
import { Button } from "@/components/ui/button";
import PATH from "@/constants/path";

// React Query 훅 사용
import { useJourney } from "../hooks/useJourneys";
import { QUERY_KEYS } from "@/constants/queryKeys";

// Zustand 스토어
import { useBlockStore } from "@/features/block/store/blockStore";
import { useContentStore } from "@/features/block/store/contentStore";
import {
  useSidebarStore,
  useUpdateGroupsForCurrentStep,
} from "@/features/block/store/sidebarStore";
import { handleKeyboardShortcuts } from "@/features/block/utils/keyboardUtils";
import { DebugPanel } from "@/features/journey/components/DebugPanel";

export default function JourneyPage() {
  const { journeyId } = useParams<{ journeyId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const prevJourneyIdRef = useRef<string | undefined>(journeyId);

  // Zustand 스토어에서 필요한 상태와 액션 가져오기
  const { setAllBlocks, setCurrentStepOrder, currentStepOrder } =
    useBlockStore();

  const { updateState: updateContentState } = useContentStore();
  const { setCurrentStepId, setStepClickHandler } = useSidebarStore();
  const updateStepGroupsForCurrentStep = useUpdateGroupsForCurrentStep();

  // React Query와 관련 상태/액션 사용
  const { data, refetch, isError, error } = useJourney(journeyId as string);

  const stepContainerRefs = useRef<StepContainerMap>({});

  // 데이터 및 현재 스텝 추출
  const journeyBlock = data?.journeyBlock || null;
  const sortedStepBlocks = data?.sortedStepBlocks || [];
  const allBlocks = data?.allBlocks || [];
  const totalSteps = sortedStepBlocks.length;

  // useCallback 사용하여 함수 메모이제이션
  const goPrev = useCallback(() => {
    setCurrentStepOrder(Math.max(0, currentStepOrder - 1));
  }, [currentStepOrder, setCurrentStepOrder]);

  const goNext = useCallback(() => {
    setCurrentStepOrder(Math.min(currentStepOrder + 1, totalSteps - 1));
  }, [currentStepOrder, totalSteps, setCurrentStepOrder]);

  // 키보드 단축키 등록 (편집 모드가 아닐 때만)
  useEffect(() => {
    const handler = (e: KeyboardEvent) =>
      handleKeyboardShortcuts(e, goPrev, goNext);
    window.addEventListener("keydown", handler, { passive: false });
    return () => window.removeEventListener("keydown", handler);
  }, [goPrev, goNext]);

  // URL에서 journeyId가 변경될 때 애플리케이션 상태를 재설정하여
  // 다른 Journey로 이동할 때 깨끗한 상태에서 시작하도록 보장
  useEffect(() => {
    if (journeyId && journeyId !== prevJourneyIdRef.current) {
      // journeyId가 실제로 변경되었을 때만 실행
      if (import.meta.env.DEV) {
        console.log(
          `Journey changed from ${prevJourneyIdRef.current} to ${journeyId}`,
        );
      }
      prevJourneyIdRef.current = journeyId;

      // 상태 초기화 - 새로운 journeyId로 이동할 때 상태를 리셋
      setCurrentStepOrder(0);
      updateContentState({
        currentStep: null,
        allSteps: [],
        highlightKeywords: true,
      });
      setCurrentStepId(undefined);

      // 무한 리패치 사이클을 방지하기 위해 기존 쿼리를 완전히 제거 후 강제 리패치
      queryClient.removeQueries({
        queryKey: QUERY_KEYS.journeys.detail(journeyId),
      });

      // 이후 새 데이터 요청
      refetch();
    }
  }, [
    journeyId,
    setCurrentStepOrder,
    updateContentState,
    setCurrentStepId,
    queryClient,
    refetch,
  ]);

  // 데이터가 로드되면 Zustand 스토어 상태 업데이트
  useEffect(() => {
    if (data) {
      const { sortedStepBlocks, allBlocks } = data;

      // 블록 스토어 상태 업데이트
      setAllBlocks(allBlocks);

      // 콘텐츠 스토어 상태 업데이트
      updateContentState({
        currentStep: sortedStepBlocks[currentStepOrder] || null,
        allSteps: sortedStepBlocks,
        highlightKeywords: true,
      });

      // 사이드바 스토어 현재 선택된 스텝 ID 업데이트
      setCurrentStepId(sortedStepBlocks[currentStepOrder]?.id);
    }
  }, [
    data,
    currentStepOrder,
    setAllBlocks,
    updateContentState,
    setCurrentStepId,
  ]);

  // 스텝 클릭 핸들러 설정
  useEffect(() => {
    if (data?.sortedStepBlocks) {
      // 스텝 클릭 시 해당 order 로 이동하는 핸들러 등록
      setStepClickHandler((stepId) => {
        // ID로 직접 스텝을 찾음
        const stepIndex = data.sortedStepBlocks.findIndex(
          (step) => step.id === stepId,
        );

        // 스텝을 찾았으면 해당 인덱스로 이동
        if (stepIndex !== -1) {
          setCurrentStepOrder(stepIndex);
        } else {
          console.error(`Step with id ${stepId} not found in sortedStepBlocks`);
        }
      });
    }
  }, [data?.sortedStepBlocks, setStepClickHandler, setCurrentStepOrder]);

  // 현재 step 이 변경될 때마다 step group 상태 업데이트
  useEffect(() => {
    if (data?.sortedStepBlocks && data?.allBlocks) {
      const currentStep = data.sortedStepBlocks[currentStepOrder];
      if (currentStep) {
        // 현재 step ID와 모든 블록을 전달하여 step group 상태 업데이트
        updateStepGroupsForCurrentStep(currentStep.id, data.allBlocks);
      }
    }
  }, [
    currentStepOrder,
    data?.sortedStepBlocks,
    data?.allBlocks,
    updateStepGroupsForCurrentStep,
  ]);

  // 에러 상태 처리
  if (isError) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4">
        <p>Journey를 불러오는 중 오류가 발생했습니다.</p>
        <p className="text-red-500">{(error as Error).message}</p>
        <Button onClick={() => navigate(PATH.HOME)}>홈으로 돌아가기</Button>
      </div>
    );
  }

  // 기존 데이터 없음 체크
  if (!journeyBlock) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4">
        <p>Journey를 찾을 수 없거나 로딩 중입니다.</p>
        <Button onClick={() => navigate(PATH.HOME)}>홈으로 돌아가기</Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white">
      {/* 사이드바 */}
      <JourneySidebar
        journeyBlock={journeyBlock as Block}
        allBlocks={allBlocks}
        stepContainerRefs={stepContainerRefs}
        onNavigateHome={() => navigate(PATH.HOME)}
      />

      {/* 메인 컨텐츠 영역 */}
      <div className="flex flex-1 flex-col bg-white">
        {/* 헤더 */}
        <JourneyHeader />

        {/* 본문 영역 */}
        <JourneyContent journeyBlock={journeyBlock as Block} />

        {/* 푸터 */}
        <JourneyFooter
          order={currentStepOrder}
          setOrder={setCurrentStepOrder}
          goPrev={goPrev}
          goNext={goNext}
          totalSteps={totalSteps}
        />
      </div>

      {/* 디버깅 패널 */}
      <DebugPanel
        currentStepOrder={currentStepOrder}
        sortedStepBlocks={sortedStepBlocks}
        allBlocks={allBlocks}
      />
    </div>
  );
}
