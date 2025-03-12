import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "@blocknote/core/fonts/inter.css";
import { StepContainerMap } from "@/features/journey/types";
import { handleKeyboardShortcuts } from "../utils/keyboardUtils";

import { JourneySidebar } from "./JourneySidebar";
import { JourneyHeader } from "./JourneyHeader";
import { JourneyContent } from "./JourneyContent";
import { JourneyFooter } from "./JourneyFooter";
import { Button } from "@/components/ui/button";
import PATH from "@/constants/path";

// React Query 훅 사용
import { useJourney } from "../hooks/useJourneys";

export default function JourneyPage() {
  const { journeyId } = useParams<{ journeyId: string }>();
  const navigate = useNavigate();

  // React Query와 관련 상태/액션 사용
  const {
    data,
    isLoading,
    error,
    currentStepIndex,
    setCurrentStepIndex,
    nextStep,
    prevStep,
    expandedGroups,
    toggleGroup,
  } = useJourney(journeyId);

  const stepContainerRefs = useRef<StepContainerMap>({});

  // 키보드 단축키 등록
  useEffect(() => {
    const handler = (e: KeyboardEvent) =>
      handleKeyboardShortcuts(e, prevStep, nextStep);
    window.addEventListener("keydown", handler, { passive: false });
    return () => window.removeEventListener("keydown", handler);
  }, [prevStep, nextStep]);

  // 데이터 및 현재 스텝 추출
  const journeyBlock = data?.journeyBlock || null;
  const flattenedSteps = data?.flattenedSteps || [];
  const allBlocks = data?.allBlocks || [];
  const currentStep = flattenedSteps[currentStepIndex] || null;

  // 로딩 중 UI
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Journey 로딩 중...</p>
      </div>
    );
  }

  // 에러 UI
  if (error) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4">
        <p>오류가 발생했습니다.</p>
        <Button onClick={() => navigate(PATH.HOME)}>홈으로 돌아가기</Button>
      </div>
    );
  }

  // 데이터가 없는 경우
  if (!journeyBlock) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4">
        <p>Journey를 찾을 수 없습니다.</p>
        <Button onClick={() => navigate(PATH.HOME)}>홈으로 돌아가기</Button>
      </div>
    );
  }

  // 공통 UI 구조
  return (
    <div className="flex h-screen bg-white">
      {/* 사이드바는 항상 표시 */}
      <JourneySidebar
        journeyBlock={journeyBlock}
        currentStep={currentStep}
        allBlocks={allBlocks}
        expandedGroups={expandedGroups}
        setExpandedGroups={toggleGroup}
        stepContainerRefs={stepContainerRefs}
        onClickStep={(groupId, stepId) => {
          const found = flattenedSteps.find(
            (fs) =>
              fs.parentId === groupId && fs.properties.stepIdInGroup === stepId,
          );
          if (found) setCurrentStepIndex(found.globalIndex);
        }}
        onNavigateHome={() => navigate(PATH.HOME)}
      />

      {/* 메인 컨텐츠 영역 */}
      <div className="flex flex-1 flex-col bg-white">
        {/* 헤더 */}
        <JourneyHeader />

        {/* 본문 영역 */}
        {currentStep && (
          <JourneyContent
            currentStep={currentStep}
            allSteps={flattenedSteps}
            journeyBlock={journeyBlock}
          />
        )}

        {/* 푸터 */}
        <JourneyFooter
          globalIndex={currentStepIndex}
          setGlobalIndex={setCurrentStepIndex}
          goPrev={prevStep}
          goNext={nextStep}
          totalSteps={flattenedSteps.length}
        />
      </div>
    </div>
  );
}
