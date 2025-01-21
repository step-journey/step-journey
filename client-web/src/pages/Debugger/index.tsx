import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  IconPlayerTrackNext,
  IconPlayerTrackPrev,
  IconChevronRight,
  IconChevronDown,
  IconSearch, // 검색 아이콘 예시
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";

import PATH from "@/constants/path";
import { flattenSteps, groupData } from "@/data";

export default function DebuggerPage() {
  const [globalIndex, setGlobalIndex] = useState(0);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {},
  );

  const navigate = useNavigate();

  // 다크 모드 예시
  const [isDarkMode, setIsDarkMode] = useState(false);
  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
    document.documentElement.classList.toggle("dark");
  };

  const currentStep = flattenSteps[globalIndex];
  const stepContainerRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Prev / Next 이동
  const goPrev = () => setGlobalIndex((p) => Math.max(0, p - 1));
  const goNext = () =>
    setGlobalIndex((p) => Math.min(flattenSteps.length - 1, p + 1));

  // 키보드 단축키 (m: 지도, arrow keys: prev/next)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tagName = (e.target as HTMLElement).tagName.toLowerCase();
      if (["input", "textarea", "select"].includes(tagName)) return;

      if (e.code === "KeyM") {
        e.preventDefault();
        setIsMapOpen((prev) => !prev);
        return;
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        goPrev();
        return;
      }
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        goNext();
        return;
      }
    };
    window.addEventListener("keydown", handleKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // 현재 Step 바뀌면 해당 Phase 만 펼치기
  useEffect(() => {
    setExpandedGroups({ [currentStep.groupId]: true });
  }, [currentStep.groupId]);

  // 펼친 Phase 내부에서 현재 Step 위치로 스크롤
  useEffect(() => {
    const gId = currentStep.groupId;
    if (!expandedGroups[gId]) return;
    setTimeout(() => {
      const container = stepContainerRefs.current[gId];
      if (!container) return;
      const stepEl = container.querySelector(
        `#step-${currentStep.globalIndex}`,
      ) as HTMLElement | null;
      stepEl?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 0);
  }, [currentStep, expandedGroups]);

  // Phase 라벨 토글
  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const isOpen = !!prev[groupId];
      return { ...prev, [groupId]: !isOpen };
    });
  };

  // 특정 Step 클릭 => globalIndex
  const handleStepClick = (groupId: string, stepIdInGroup: number) => {
    const found = flattenSteps.find(
      (fs) => fs.groupId === groupId && fs.stepIdInGroup === stepIdInGroup,
    );
    if (found) {
      setGlobalIndex(found.globalIndex);
    }
  };

  // Slider 조작
  const handleSliderChange = (val: number[]) => {
    setGlobalIndex(val[0]);
  };
  const handleSliderPointerUp = () => {
    setTimeout(() => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }, 0);
  };

  // 지도 모달
  const openMap = () => setIsMapOpen(true);
  const closeMap = () => setIsMapOpen(false);

  return (
    <div className="flex h-screen bg-white">
      {/*
    (1) 좌측 사이드바
  */}
      <aside className="flex flex-col border-r border-gray-200 bg-white w-[280px]">
        {/* 상단: 제목 + 검색창 */}
        <div className="shrink-0 p-4 pb-2">
          <h1 className="mb-3 text-base font-bold">Google Search Journey</h1>
          {/* 검색창 */}
          <div className="relative">
            <IconSearch
              size={16}
              className="absolute top-1/2 left-2 -translate-y-1/2 text-gray-400"
            />
            <Input
              type="text"
              placeholder="Search"
              className="w-full border-gray-200 bg-gray-50 py-1 pr-2 pl-7 text-sm"
            />
          </div>
        </div>

        {/* 단계 목록 스크롤 영역 */}
        <ScrollArea className="flex-1 py-2 pr-1 pl-4">
          {groupData.map((grp) => {
            const isExpanded = expandedGroups[grp.groupId] || false;
            const isCurrentGroup = grp.groupId === currentStep.groupId;

            // 그룹 라벨 전체 줄을 높이 2rem(h-8)로 잡고 items-center 로 수직정렬
            let groupLabelClass = `
          flex items-center h-8 px-2 gap-2 cursor-pointer
          rounded hover:bg-gray-100 text-step
        `;
            // 현재 그룹이면 폰트 두께 추가
            if (isCurrentGroup) {
              groupLabelClass += " font-semibold";
              // 접혀 있다면 글자색 파란색
              if (!isExpanded) {
                groupLabelClass += " !text-blue-600";
              }
            }

            return (
              <div key={grp.groupId} className="mb-2">
                <div
                  className={groupLabelClass}
                  onClick={() => toggleGroup(grp.groupId)}
                >
                  {/* 라벨 텍스트 */}
                  <span className="flex-1 whitespace-nowrap text-sm">
                    {grp.groupLabel}
                  </span>
                  {/* 우측 아이콘 (vertical-align 고정) */}
                  {isExpanded ? (
                    <IconChevronDown className="h-4 w-4" />
                  ) : (
                    <IconChevronRight className="h-4 w-4" />
                  )}
                </div>

                {/* 펼쳐진 단계 목록 */}
                {isExpanded && (
                  <div
                    ref={(el) => (stepContainerRefs.current[grp.groupId] = el)}
                    className="mt-1 ml-5 flex flex-col gap-1 overflow-auto max-h-[300px]"
                  >
                    {grp.steps.map((st) => {
                      const foundFs = flattenSteps.find(
                        (fs) =>
                          fs.groupId === grp.groupId &&
                          fs.stepIdInGroup === st.id,
                      );
                      if (!foundFs) return null;

                      const isActive =
                        foundFs.globalIndex === currentStep.globalIndex;

                      const stepClass = [
                        "px-2 py-1 rounded text-sm cursor-pointer hover:bg-gray-100",
                        isActive
                          ? "bg-gray-100 font-medium text-blue-600"
                          : "text-step",
                      ].join(" ");

                      return (
                        <div
                          key={st.id}
                          id={`step-${foundFs.globalIndex}`}
                          className={stepClass}
                          onClick={() => handleStepClick(grp.groupId, st.id)}
                        >
                          {st.label}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </ScrollArea>
      </aside>

      {/* 우측 메인 영역 */}
      <div className="flex flex-1 flex-col bg-white">
        {/* 
          상단 헤더: 
            - height 고정: h-[56px] (Stripe API Docs와 동일)
            - px-8 정도로 좌우 여백
            - text-sm or text-[14px] 정도 폰트
            - space-x-6 등으로 항목 간격
        */}
        <div
          className="
          h-[56px]
          w-full
          px-8
          border-b border-gray-200
          flex
          items-center
          justify-end
          gap-6
          text-sm
          text-blue-600
        "
        >
          <Button variant="ghost" size="default" onClick={openMap}>
            지도 (m)
          </Button>
          <Button variant="ghost" size="default" onClick={toggleDarkMode}>
            {isDarkMode ? "Light Mode" : "Dark Mode"}
          </Button>
          <Button
            variant="ghost"
            size="default"
            onClick={() => navigate(PATH.ABOUT)}
          >
            About
          </Button>
        </div>

        {/* 중앙 본문 */}
        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          <p className="mb-1 text-lg font-semibold">
            Current Step: {currentStep.label}
          </p>
          <p className="mb-4 text-sm text-gray-500">{currentStep.desc}</p>

          <Card className="border border-gray-200 bg-white p-4">
            <p className="mb-2 text-sm font-medium">여기에 해당 단계 내용</p>
            <ul className="list-inside list-disc text-sm text-gray-600">
              <li>코드 스니펫, 서버로그, API 응답 등</li>
              <li>직접 조작 예시</li>
            </ul>
          </Card>
        </div>

        {/* 하단 Footer: Slider + Prev/Next + Step indicator */}
        <div className="flex h-12 shrink-0 items-center gap-3 border-t border-gray-200 bg-white px-4">
          {/* 슬라이더 (flex-1) */}
          <Slider
            className="flex-1"
            max={flattenSteps.length - 1}
            value={[globalIndex]}
            onValueChange={handleSliderChange}
            onPointerUp={handleSliderPointerUp}
          />
          {/* Prev / Next 버튼 */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={goPrev}>
              <IconPlayerTrackPrev className="mr-1" size={16} />
              Prev
            </Button>
            <Button variant="outline" size="sm" onClick={goNext}>
              Next
              <IconPlayerTrackNext className="ml-1" size={16} />
            </Button>
          </div>
          {/* Step 표시 (한 줄 표시) */}
          <span className="w-20 whitespace-nowrap text-right text-sm text-gray-500">
            Step {globalIndex + 1} / {flattenSteps.length}
          </span>
        </div>
      </div>

      {/* 지도 모달 */}
      <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
        <DialogContent
          className="sm:max-w-[600px]"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>지도</DialogTitle>
          </DialogHeader>
          <p className="mb-2 text-sm">
            현재 단계: <b>{currentStep.label}</b> ({currentStep.globalIndex + 1}{" "}
            / {flattenSteps.length})
          </p>

          <div className="flex flex-wrap gap-3 rounded border border-gray-200 p-3">
            {groupData.map((grp) => (
              <Tooltip key={grp.groupId} delayDuration={0}>
                <TooltipTrigger>
                  <div
                    className={
                      "cursor-pointer border border-gray-200 rounded px-2 py-1 min-w-[120px]" +
                      (grp.groupId === currentStep.groupId
                        ? " bg-blue-50"
                        : " bg-white text-gray-700")
                    }
                  >
                    <p className="text-sm font-bold">{grp.groupLabel}</p>
                    <p className="text-xs text-gray-400">
                      (Step count: {grp.steps.length})
                    </p>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs whitespace-pre-wrap">
                    {grp.mapDescription}
                  </p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>

          <div className="mt-4 text-right">
            <Button variant="outline" size="sm" onClick={closeMap}>
              닫기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
