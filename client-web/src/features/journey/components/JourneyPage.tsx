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

export default function JourneyPage() {
  const { journeyId } = useParams<{ journeyId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const prevJourneyIdRef = useRef<string | undefined>(journeyId);

  // Zustand 스토어에서 필요한 상태와 액션 가져오기
  const { setAllBlocks, setCurrentStepIndex, currentStepIndex } =
    useBlockStore();

  const { updateState: updateContentState } = useContentStore();
  const { setCurrentStepId, setStepClickHandler } = useSidebarStore();
  const updateStepGroupsForCurrentStep = useUpdateGroupsForCurrentStep();

  // React Query와 관련 상태/액션 사용
  const { data, refetch } = useJourney(journeyId);

  const stepContainerRefs = useRef<StepContainerMap>({});

  // 데이터 및 현재 스텝 추출
  const journeyBlock = data?.journeyBlock || null;
  const flattenedSteps = data?.flattenedSteps || [];
  const allBlocks = data?.allBlocks || [];
  const totalSteps = flattenedSteps.length;

  // useCallback 사용하여 함수 메모이제이션
  // currentStepIndex 또는 totalSteps 변경될 때만 함수가 재생성되므로 불필요한 useEffect 호출 방지
  const goPrev = useCallback(() => {
    setCurrentStepIndex(Math.max(0, currentStepIndex - 1));
  }, [currentStepIndex, setCurrentStepIndex]);

  const goNext = useCallback(() => {
    setCurrentStepIndex(Math.min(currentStepIndex + 1, totalSteps - 1));
  }, [currentStepIndex, totalSteps, setCurrentStepIndex]);

  // 키보드 단축키 등록 (편집 모드가 아닐 때만)
  useEffect(() => {
    const handler = (e: KeyboardEvent) =>
      handleKeyboardShortcuts(e, goPrev, goNext);
    window.addEventListener("keydown", handler, { passive: false });
    return () => window.removeEventListener("keydown", handler);
  }, [goPrev, goNext]);

  // URL 에서 journeyId가 변경될 때 애플리케이션 상태를 재설정하여
  // 다른 Journey 로 이동할 때 깨끗한 상태에서 시작하도록 보장
  useEffect(() => {
    if (journeyId && journeyId !== prevJourneyIdRef.current) {
      // journeyId가 실제로 변경되었을 때만 실행
      console.log(
        `Journey changed from ${prevJourneyIdRef.current} to ${journeyId}`,
      );
      prevJourneyIdRef.current = journeyId;

      // 상태 초기화 - 새로운 journeyId로 이동할 때 상태를 리셋
      setCurrentStepIndex(0);
      updateContentState({
        currentStep: null,
        allSteps: [],
        highlightKeywords: true,
      });
      setCurrentStepId(undefined);

      // React Query 캐시 무효화 및 강제 리패치
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.journeys.detail(journeyId),
      });
      refetch(); // 즉시 리패치 강제 실행
    }
  }, [
    journeyId,
    setCurrentStepIndex,
    updateContentState,
    setCurrentStepId,
    queryClient,
    refetch,
  ]);

  // 데이터가 로드되면 Zustand 스토어 상태 업데이트
  useEffect(() => {
    if (data) {
      const { flattenedSteps, allBlocks } = data;

      // 블록 스토어 상태 업데이트
      setAllBlocks(allBlocks);

      // 콘텐츠 스토어 상태 업데이트
      updateContentState({
        currentStep: flattenedSteps[currentStepIndex] || null,
        allSteps: flattenedSteps,
        highlightKeywords: true,
      });

      // 사이드바 스토어 현재 선택된 스텝 ID 업데이트
      setCurrentStepId(flattenedSteps[currentStepIndex]?.id);
    }
  }, [
    data,
    currentStepIndex,
    setAllBlocks,
    updateContentState,
    setCurrentStepId,
  ]);

  // 스텝 클릭 핸들러 설정
  useEffect(() => {
    if (data?.flattenedSteps) {
      // 스텝 클릭 시 해당 globalIndex 로 이동하는 핸들러 등록
      setStepClickHandler((groupId, stepGlobalIndex) => {
        const found = data.flattenedSteps.find(
          (fs) =>
            fs.parentId === groupId &&
            fs.properties.globalIndex === stepGlobalIndex,
        );

        if (found) {
          if (found.properties.globalIndex === undefined) {
            console.error(
              `Step ${found.id} has undefined globalIndex property`,
            );
            throw new Error(`Step is missing required globalIndex property`);
          }
          setCurrentStepIndex(found.properties.globalIndex);
        }
      });
    }
  }, [data?.flattenedSteps, setStepClickHandler, setCurrentStepIndex]);

  // 현재 step 이 변경될 때마다 step group 상태 업데이트
  useEffect(() => {
    if (data?.flattenedSteps && data?.allBlocks) {
      const currentStep = data.flattenedSteps[currentStepIndex];
      if (currentStep) {
        // 현재 step ID와 모든 블록을 전달하여 step group 상태 업데이트
        updateStepGroupsForCurrentStep(currentStep.id, data.allBlocks);
      }
    }
  }, [
    currentStepIndex,
    data?.flattenedSteps,
    data?.allBlocks,
    updateStepGroupsForCurrentStep,
  ]);

  // 데이터 로딩이 완료되고 journeyBlock이 있는 경우만 UI 렌더링
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
          globalIndex={currentStepIndex}
          setGlobalIndex={setCurrentStepIndex}
          goPrev={goPrev}
          goNext={goNext}
          totalSteps={totalSteps}
        />
      </div>
    </div>
  );
}
