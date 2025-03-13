import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "@blocknote/core/fonts/inter.css";
import { Block, StepContainerMap } from "@/features/block/types";
import { handleKeyboardShortcuts } from "@/features/block/utils/keyboardUtils";

import { JourneySidebar } from "./JourneySidebar";
import { JourneyHeader } from "./JourneyHeader";
import { JourneyContent } from "./JourneyContent";
import { JourneyFooter } from "./JourneyFooter";
import { Button } from "@/components/ui/button";
import PATH from "@/constants/path";

// React Query 훅 사용
import { useJourney } from "../hooks/useJourneys";

// Zustand 스토어
import { useBlockStore } from "@/features/block/store/blockStore";
import { useContentStore } from "@/features/block/store/contentStore";
import { useSidebarStore } from "@/features/block/store/sidebarStore";

export default function JourneyPage() {
  const { journeyId } = useParams<{ journeyId: string }>();
  const navigate = useNavigate();

  // Zustand 스토어에서 필요한 상태와 액션 가져오기
  const {
    setAllBlocks,
    setCurrentStepIndex,
    currentStepIndex,
    prevStep: zustandPrevStep,
    nextStep: zustandNextStep,
  } = useBlockStore();

  const { updateState: updateContentState } = useContentStore();
  const { setCurrentStepId, setStepClickHandler } = useSidebarStore();

  // React Query와 관련 상태/액션 사용
  const { data } = useJourney(journeyId);

  const stepContainerRefs = useRef<StepContainerMap>({});

  // 키보드 단축키 등록
  useEffect(() => {
    const handler = (e: KeyboardEvent) =>
      handleKeyboardShortcuts(e, zustandPrevStep, zustandNextStep);
    window.addEventListener("keydown", handler, { passive: false });
    return () => window.removeEventListener("keydown", handler);
  }, [zustandPrevStep, zustandNextStep]);

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
      // 스텝 클릭 시 인덱스 변경하는 핸들러 등록
      setStepClickHandler((groupId, stepId) => {
        const found = data.flattenedSteps.find(
          (fs) =>
            fs.parentId === groupId && fs.properties.stepIdInGroup === stepId,
        );
        if (found) setCurrentStepIndex(found.globalIndex);
      });
    }
  }, [data?.flattenedSteps, setStepClickHandler, setCurrentStepIndex]);

  // 데이터 및 현재 스텝 추출
  const journeyBlock = data?.journeyBlock || null;
  const flattenedSteps = data?.flattenedSteps || [];
  const allBlocks = data?.allBlocks || [];

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
      {/* 사이드바는 항상 표시 */}
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

        {/* 푸터 - Zustand 의 액션 사용 */}
        <JourneyFooter
          globalIndex={currentStepIndex}
          setGlobalIndex={setCurrentStepIndex}
          goPrev={zustandPrevStep}
          goNext={zustandNextStep}
          totalSteps={flattenedSteps.length}
        />
      </div>
    </div>
  );
}
