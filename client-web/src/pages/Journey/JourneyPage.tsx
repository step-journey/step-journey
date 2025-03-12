import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import "@blocknote/core/fonts/inter.css";
import { StepContainerMap } from "@/types/journey";
import { handleKeyboardShortcuts } from "./journey.utils";

import { JourneySidebar } from "./JourneySidebar";
import { JourneyHeader } from "./JourneyHeader";
import { JourneyContent } from "./JourneyContent";
import { JourneyFooter } from "./JourneyFooter";
import { Button } from "@/components/ui/button";
import PATH from "@/constants/path";

import { toast } from "sonner";
import { initializeDatabase } from "@/services/journeyService";
import { useJourneyStore } from "@/store/journeyStore";

// 페이지 모드 타입 정의
type JourneyPageMode = "view" | "edit" | "create";

export default function JourneyPage() {
  const { journeyId } = useParams<{ journeyId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Zustand 스토어에서 상태와 액션 가져오기
  const {
    currentJourney,
    isLoadingCurrentJourney,
    flattenedSteps,
    currentStepIndex,
    expandedGroups,
    title,
    description,
    saveStatus,
    lastSavedTime,
    loadJourney,
    setCurrentStepIndex,
    nextStep,
    prevStep,
    toggleGroup,
    setTitle,
    setDescription,
    setBlocks,
    saveJourney,
  } = useJourneyStore();

  // 페이지 모드 설정 (URL 경로에 따라 모드 결정)
  const getPageMode = (): JourneyPageMode => {
    if (location.pathname.endsWith("/edit")) return "edit";
    if (location.pathname.endsWith("/create")) return "create";
    return "view";
  };

  const [mode, setMode] = useState<JourneyPageMode>(getPageMode());
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const stepContainerRefs = useRef<StepContainerMap>({});

  // 현재 스텝 계산
  const currentStep =
    flattenedSteps.length > 0 ? flattenedSteps[currentStepIndex] : null;

  // 페이지 모드에 따라 필요한 데이터 로드 또는 초기화
  useEffect(() => {
    const newMode = getPageMode();
    setMode(newMode);

    const loadData = async () => {
      if (!journeyId) return;

      try {
        // 데이터베이스 초기화
        await initializeDatabase();

        // 저니 로드
        await loadJourney(journeyId, newMode);
      } catch (error) {
        console.error("Failed to load journey:", error);
        toast.error("Journey를 불러오는 중 오류가 발생했습니다.");
        navigate(PATH.HOME);
      }
    };

    loadData();
  }, [journeyId, location.pathname, loadJourney, navigate]);

  // 키보드 단축키 등록
  useEffect(() => {
    const handler = (e: KeyboardEvent) =>
      handleKeyboardShortcuts(e, prevStep, nextStep);
    window.addEventListener("keydown", handler, { passive: false });
    return () => window.removeEventListener("keydown", handler);
  }, [prevStep, nextStep]);

  // 저장 상태 변경 감지 및 메시지 업데이트
  useEffect(() => {
    if (saveStatus === "saving") {
      setSaveMessage("저장 중...");
    } else if (saveStatus === "saved") {
      setSaveMessage("저장됨");
      // 3초 후 메시지 제거
      const timer = setTimeout(() => setSaveMessage(null), 3000);
      return () => clearTimeout(timer);
    } else if (saveStatus === "failed") {
      setSaveMessage("저장 실패");
    } else {
      setSaveMessage(null);
    }
  }, [saveStatus]);

  // 자동 저장 설정
  useEffect(() => {
    if (mode !== "edit" && mode !== "create") return;

    const timer = setTimeout(() => {
      saveJourney();
    }, 2000);

    return () => clearTimeout(timer);
  }, [title, description, mode, saveJourney]);

  // 모드 전환 핸들러
  const handleEditClick = () => {
    if (journeyId) {
      navigate(`${PATH.JOURNEY}/${journeyId}/edit`);
    }
  };

  // 취소 처리
  const handleCancel = () => {
    if (mode === "create") {
      if (
        confirm("작성 중인 내용이 저장되지 않습니다. 정말 취소하시겠습니까?")
      ) {
        navigate(PATH.HOME);
      }
    } else if (mode === "edit" && journeyId) {
      // 편집 모드에서는 확인 없이 바로 보기 모드로 이동
      navigate(`${PATH.JOURNEY}/${journeyId}`);
    }
  };

  // 저장 상태 메시지 렌더링
  const renderSaveStatus = () => {
    if (!saveMessage) return null;

    let className = "text-sm ";
    if (saveStatus === "saving") {
      className += "text-yellow-500";
    } else if (saveStatus === "saved") {
      className += "text-green-500";
    } else if (saveStatus === "failed") {
      className += "text-red-500";
    }

    return <span className={className}>{saveMessage}</span>;
  };

  // 추가 버튼 렌더링 (편집/생성 모드용)
  const renderAdditionalButtons = () => (
    <div className="flex items-center gap-4">
      {renderSaveStatus()}

      <Button variant="outline" size="sm" onClick={handleCancel}>
        {mode === "create" ? "홈으로" : "보기 모드"}
      </Button>

      {lastSavedTime && (
        <div className="text-xs text-gray-500">
          마지막 저장: {lastSavedTime.toLocaleTimeString()}
        </div>
      )}
    </div>
  );

  // 로딩 중 UI
  if (isLoadingCurrentJourney) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Journey 로딩 중...</p>
      </div>
    );
  }

  // 데이터가 없는 경우 (view/edit 모드)
  if ((mode === "view" || mode === "edit") && !currentJourney) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4">
        <p>Journey를 찾을 수 없습니다.</p>
        <Button onClick={() => navigate(PATH.HOME)}>홈으로 돌아가기</Button>
      </div>
    );
  }

  // 공통 UI 구조 - 항상 동일한 구조 사용
  return (
    <div className="flex h-screen bg-white">
      {/* 사이드바는 항상 표시 */}
      {currentJourney && currentStep && (
        <JourneySidebar
          journey={currentJourney}
          currentStep={currentStep}
          expandedGroups={expandedGroups}
          setExpandedGroups={toggleGroup}
          stepContainerRefs={stepContainerRefs}
          onClickStep={(groupId, stepId) => {
            const found = flattenedSteps.find(
              (fs) => fs.groupId === groupId && fs.stepIdInGroup === stepId,
            );
            if (found) setCurrentStepIndex(found.globalIndex);
          }}
          onNavigateHome={() => navigate(PATH.HOME)}
        />
      )}

      {/* 메인 컨텐츠 영역 */}
      <div className="flex flex-1 flex-col bg-white">
        {/* 헤더 - 모드에 따라 버튼만 다르게 표시 */}
        <JourneyHeader
          isEditMode={mode === "edit" || mode === "create"}
          onEditClick={mode === "view" ? handleEditClick : undefined}
          renderAdditionalButtons={
            mode === "edit" || mode === "create"
              ? renderAdditionalButtons
              : undefined
          }
        />

        {/* 본문 영역 - 동일한 JourneyContent 컴포넌트 사용 */}
        {currentJourney && currentStep && (
          <JourneyContent
            currentStep={currentStep}
            allSteps={flattenedSteps}
            journey={currentJourney}
            editable={mode === "edit" || mode === "create"}
            onTitleChange={setTitle}
            onDescriptionChange={setDescription}
            onJourneyContentChange={setBlocks}
          />
        )}

        {/* 푸터 - 항상 표시 */}
        {currentJourney && currentStep && (
          <JourneyFooter
            globalIndex={currentStepIndex}
            setGlobalIndex={setCurrentStepIndex}
            goPrev={prevStep}
            goNext={nextStep}
            totalSteps={flattenedSteps.length}
          />
        )}
      </div>
    </div>
  );
}
