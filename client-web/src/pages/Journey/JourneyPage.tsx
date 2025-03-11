import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { journeys, getJourneyById, flattenJourneySteps } from "@/data";
import { StepContainerMap } from "@/types/journey";
import { handleKeyboardShortcuts, scrollToCurrentStep } from "./journey.utils";

import { JourneySidebar } from "./JourneySidebar";
import { JourneyHeader } from "./JourneyHeader";
import { JourneyContent } from "./JourneyContent";
import { JourneyFooter } from "./JourneyFooter";
import { JourneyMapModal } from "./JourneyMapModal";
import PATH from "@/constants/path";

export default function JourneyPage() {
  // URL에서 journeyId 파라미터 가져오기
  const { journeyId } = useParams<{ journeyId: string }>();
  const navigate = useNavigate();

  // 현재 Journey 찾기 (없으면 기본값으로 첫 번째 Journey 사용)
  const currentJourney = getJourneyById(journeyId || "") || journeys[0];

  // 선택된 Journey의 단계들 평탄화
  const flattenSteps = flattenJourneySteps(currentJourney);

  // 전역 스텝 인덱스
  const [globalIndex, setGlobalIndex] = useState(0);

  // 현재 스텝 (flattenSteps 에서 globalIndex 로 추출)
  const currentStep = flattenSteps[globalIndex];

  // 전체 스텝 개수
  const totalSteps = flattenSteps.length;

  // 그룹(Phase) 펼침/접힘 상태
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {},
  );

  // 지도 모달 상태
  const [isMapOpen, setIsMapOpen] = useState(false);

  // 다크 모드 (임의 예시)
  const [isDarkMode, setIsDarkMode] = useState(false);

  // 각 Phase 별 ScrollArea DOM 참조
  const stepContainerRefs = useRef<StepContainerMap>({});

  // Prev / Next 핸들러
  const goPrev = () => setGlobalIndex((prev) => Math.max(0, prev - 1));
  const goNext = () =>
    setGlobalIndex((prev) => Math.min(prev + 1, totalSteps - 1));

  // 키보드 단축키 등록 (m키 지도, 방향키 Prev/Next 등)
  useEffect(() => {
    const handler = (e: KeyboardEvent) =>
      handleKeyboardShortcuts(e, setIsMapOpen, goPrev, goNext);
    window.addEventListener("keydown", handler, { passive: false });
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // currentStep 바뀔 때 해당 group 펼치도록
  useEffect(() => {
    if (currentStep) {
      setExpandedGroups({ [currentStep.groupId]: true });
    }
  }, [currentStep?.groupId]);

  // 펼쳐진 Phase 내부에서 현재 스텝 위치로 스크롤
  useEffect(() => {
    if (currentStep) {
      scrollToCurrentStep(currentStep, expandedGroups, stepContainerRefs);
    }
  }, [currentStep, expandedGroups]);

  // journeyId가 변경되면 globalIndex 초기화
  useEffect(() => {
    setGlobalIndex(0);
  }, [journeyId]);

  // 존재하지 않는 Journey ID인 경우 홈으로 리다이렉트
  useEffect(() => {
    if (journeyId && !getJourneyById(journeyId)) {
      navigate(PATH.HOME);
    }
  }, [journeyId, navigate]);

  // 다크 모드 토글
  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
    document.documentElement.classList.toggle("dark");
  };

  if (!currentStep) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-white">
      {/* 좌측 사이드바 */}
      <JourneySidebar
        journey={currentJourney}
        currentStep={currentStep}
        expandedGroups={expandedGroups}
        setExpandedGroups={setExpandedGroups}
        stepContainerRefs={stepContainerRefs}
        onClickStep={(groupId, stepId) => {
          const found = flattenSteps.find(
            (fs) => fs.groupId === groupId && fs.stepIdInGroup === stepId,
          );
          if (found) setGlobalIndex(found.globalIndex);
        }}
        onNavigateHome={() => navigate(PATH.HOME)}
      />

      {/* 우측 영역: 헤더 / 본문 / 푸터 / 변수패널 */}
      <div className="flex flex-1 flex-col bg-white">
        {/* 헤더 */}
        <JourneyHeader
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
          onOpenMap={() => setIsMapOpen(true)}
          onNavigateAbout={() => navigate(PATH.ABOUT)}
        />

        {/* 본문: currentStep 내용 */}
        <JourneyContent
          currentStep={currentStep}
          allSteps={flattenSteps}
          journey={currentJourney}
        />

        {/* 푸터: Prev/Next + Slider */}
        <JourneyFooter
          globalIndex={globalIndex}
          setGlobalIndex={setGlobalIndex}
          goPrev={goPrev}
          goNext={goNext}
          totalSteps={totalSteps}
        />
      </div>

      {/* 지도 모달 */}
      <JourneyMapModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        currentStep={currentStep}
        groupData={currentJourney.groups}
      />
    </div>
  );
}
