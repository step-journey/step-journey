import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import "@blocknote/core/fonts/inter.css";
import { Block as BlockNoteBlock } from "@blocknote/core";
import { StepContainerMap, FlattenedStep, Journey } from "@/types/journey";
import { handleKeyboardShortcuts, scrollToCurrentStep } from "./journey.utils";

import { JourneySidebar } from "./JourneySidebar";
import { JourneyHeader } from "./JourneyHeader";
import { JourneyContent } from "./JourneyContent";
import { JourneyFooter } from "./JourneyFooter";
import { Button } from "@/components/ui/button";
import PATH from "@/constants/path";
import {
  getJourney,
  createJourney,
  updateJourney,
  initializeDatabase,
} from "@/services/journeyService";
import { convertBlockNoteToJourney } from "@/utils/blockNoteConverter";
import { getJourneyById, flattenJourneySteps } from "@/data";
import { toast } from "sonner";
import { useAutoSave } from "@/hooks/useAutoSave";

// 페이지 모드 타입 정의
type JourneyPageMode = "view" | "edit" | "create";

// 수정 가능한 Journey 데이터 인터페이스
interface EditableJourneyData {
  title: string;
  description: string;
  blocks: BlockNoteBlock[];
  journeyId: string | null;
  journey: Journey | null;
}

export default function JourneyPage() {
  const { journeyId } = useParams<{ journeyId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // 페이지 모드 설정 (URL 경로에 따라 모드 결정)
  const getPageMode = (): JourneyPageMode => {
    if (location.pathname.endsWith("/edit")) return "edit";
    return "view";
  };

  const [mode, setMode] = useState<JourneyPageMode>(getPageMode());

  // 공통 상태
  const [isLoading, setIsLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Journey 상태 관리
  const [currentJourney, setCurrentJourney] = useState<Journey | null>(null);
  const [title, setTitle] = useState<string>("Untitled Journey");
  const [description, setDescription] = useState<string>("");
  const [journeyBlocks, setJourneyBlocks] = useState<BlockNoteBlock[]>([]);
  const [flattenSteps, setFlattenSteps] = useState<FlattenedStep[]>([]);

  // 마지막으로 저장된 시간
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);

  // 뷰 모드 상태
  const [globalIndex, setGlobalIndex] = useState(0);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {},
  );
  const stepContainerRefs = useRef<StepContainerMap>({});

  // 현재 스텝 계산
  const currentStep =
    flattenSteps.length > 0 ? flattenSteps[globalIndex] : null;

  // 자동 저장 데이터 구성
  const autoSaveData: EditableJourneyData = {
    title,
    description,
    blocks: journeyBlocks,
    journeyId: journeyId || null,
    journey: currentJourney,
  };

  // 자동 저장 함수
  const saveJourney = useCallback(
    async (data: EditableJourneyData) => {
      // 생성 모드 또는 편집 모드가 아니면 저장하지 않음
      if (mode !== "edit" && mode !== "create") return;

      // 데이터가 불완전하면 저장하지 않음
      if (!data.title.trim()) {
        return;
      }

      try {
        // 에디터 내용을 Journey 구조로 변환
        const { groups } = convertBlockNoteToJourney(
          data.blocks,
          data.journey || undefined,
        );

        if (mode === "create") {
          // 새 Journey 생성
          const newJourneyId = await createJourney({
            title: data.title,
            description: data.description,
            groups: groups.length > 0 ? groups : data.journey?.groups || [],
            id: uuidv4(),
          });

          // 생성 후 편집 모드로 리디렉션
          if (location.pathname.endsWith("/create")) {
            navigate(`${PATH.JOURNEY}/${newJourneyId}/edit`, { replace: true });
          }
        } else if (mode === "edit" && data.journeyId) {
          // 기존 Journey 업데이트
          await updateJourney(data.journeyId, {
            title: data.title,
            description: data.description,
            groups: groups.length > 0 ? groups : data.journey?.groups || [],
            updated_at: new Date().toISOString(),
          });
        }

        // 저장 시간 업데이트
        setLastSavedTime(new Date());
      } catch (error) {
        console.error("Failed to auto-save journey:", error);
        throw error; // 에러를 다시 던져서 useAutoSave에서 처리할 수 있게 함
      }
    },
    [mode, location.pathname, navigate],
  );

  // 자동 저장 훅 사용
  const { saveStatus } = useAutoSave(autoSaveData, saveJourney, {
    debounceTime: 2000, // 2초 디바운스
    onSaveStart: () => setSaveMessage("저장 중..."),
    onSaveEnd: (success) => {
      if (success) {
        setSaveMessage("저장됨");
        // 3초 후 메시지 제거
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        setSaveMessage("저장 실패");
      }
    },
  });

  // 데이터베이스 초기화
  useEffect(() => {
    initializeDatabase().catch(console.error);
  }, []);

  // 페이지 모드에 따라 필요한 데이터 로드 또는 초기화
  useEffect(() => {
    const newMode = getPageMode();
    setMode(newMode);

    const loadData = async () => {
      setIsLoading(true);

      try {
        if (newMode === "create") {
          // 생성 모드 - 기본 데이터 설정
          const defaultJourney: Journey = {
            id: uuidv4(),
            title: "Untitled Journey",
            description: "",
            step_order: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            groups: [
              {
                groupId: `group-${uuidv4()}`,
                groupLabel: "기본 그룹",
                mapDescription: "첫 번째 그룹입니다.",
                steps: [
                  {
                    id: '1',
                    label: "기본 단계",
                    desc: "이 단계는 기본적으로 생성되었습니다.",
                    content: ["여기에 내용을 추가하세요."],
                  },
                ],
              },
            ],
          };

          setCurrentJourney(defaultJourney);
          setTitle(defaultJourney.title);
          setDescription(defaultJourney.description || "");

          const steps = flattenJourneySteps(defaultJourney);
          setFlattenSteps(steps);

          if (steps.length > 0) {
            setExpandedGroups({ [steps[0].groupId]: true });
          }
        } else if (journeyId) {
          // 보기/편집 모드 - ID로 데이터 로드
          console.log(
            `Loading journey for ${newMode} mode with ID:`,
            journeyId,
          );

          // DB 및 정적 데이터에서 Journey 찾기
          let journey = await getJourney(journeyId);
          if (!journey) {
            journey = getJourneyById(journeyId);
          }

          if (!journey) {
            console.error("Journey not found with ID:", journeyId);
            toast.error("Journey를 찾을 수 없습니다.");
            setIsLoading(false);
            navigate(PATH.HOME);
            return;
          }

          // Journey 데이터 설정
          setCurrentJourney(journey);
          setTitle(journey.title);
          setDescription(journey.description || "");

          // 그룹 데이터 확인
          if (
            !journey.groups ||
            !Array.isArray(journey.groups) ||
            journey.groups.length === 0
          ) {
            console.warn("Journey has no groups, creating a default group");
            journey.groups = [
              {
                groupId: "default-group",
                groupLabel: "기본 그룹",
                mapDescription: "이 그룹은 기본적으로 생성되었습니다.",
                steps: [
                  {
                    id: '1',
                    label: "기본 단계",
                    desc: "내용을 추가하려면 편집 버튼을 클릭하세요.",
                    content: ["여기에 내용을 추가하세요."],
                  },
                ],
              },
            ];
          }

          // 단계 평탄화
          const steps = flattenJourneySteps(journey);
          setFlattenSteps(steps);

          // 첫 번째 그룹 펼치기
          if (steps.length > 0) {
            setExpandedGroups({ [steps[0].groupId]: true });
          }
        }
      } catch (error) {
        console.error("Failed to load journey:", error);
        toast.error("Journey를 불러오는 중 오류가 발생했습니다.");
        navigate(PATH.HOME);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [journeyId, location.pathname, navigate]);

  // journey 내용이 변경되었을 때 index 초기화
  useEffect(() => {
    setGlobalIndex(0);
  }, [journeyId]);

  // 키보드 단축키 등록
  useEffect(() => {
    const handler = (e: KeyboardEvent) =>
      handleKeyboardShortcuts(e, goPrev, goNext);
    window.addEventListener("keydown", handler, { passive: false });
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // currentStep 바뀔 때 해당 group 펼치도록
  useEffect(() => {
    if (currentStep) {
      setExpandedGroups((prev) => ({ ...prev, [currentStep.groupId]: true }));
    }
  }, [currentStep?.groupId]);

  // 펼쳐진 Phase 내부에서 현재 스텝 위치로 스크롤
  useEffect(() => {
    if (currentStep && mode === "view") {
      scrollToCurrentStep(currentStep, expandedGroups, stepContainerRefs);
    }
  }, [currentStep, expandedGroups, mode]);

  // Prev / Next 핸들러
  const goPrev = () => setGlobalIndex((prev) => Math.max(0, prev - 1));
  const goNext = () => {
    const maxIndex = flattenSteps.length - 1;
    setGlobalIndex((prev) => Math.min(prev + 1, maxIndex >= 0 ? maxIndex : 0));
  };

  // 모드 전환 핸들러
  const handleEditClick = () => {
    if (journeyId) {
      navigate(`${PATH.JOURNEY}/${journeyId}/edit`);
    }
  };

  // 제목 변경 핸들러
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
  };

  // 설명 변경 핸들러
  const handleDescriptionChange = (newDescription: string) => {
    setDescription(newDescription);
  };

  // 내용 변경 핸들러
  const handleContentChange = (blocks: BlockNoteBlock[]) => {
    setJourneyBlocks(blocks);
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
  if (isLoading) {
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
            allSteps={flattenSteps}
            journey={currentJourney}
            editable={mode === "edit" || mode === "create"}
            onTitleChange={handleTitleChange}
            onDescriptionChange={handleDescriptionChange}
            onJourneyContentChange={handleContentChange}
          />
        )}

        {/* 푸터 - 항상 표시 */}
        {currentJourney && currentStep && (
          <JourneyFooter
            globalIndex={globalIndex}
            setGlobalIndex={setGlobalIndex}
            goPrev={goPrev}
            goNext={goNext}
            totalSteps={flattenSteps.length}
          />
        )}
      </div>
    </div>
  );
}
