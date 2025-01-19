import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  IconPlayerTrackNext,
  IconPlayerTrackPrev,
  IconChevronRight,
  IconChevronDown,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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

import PATH from "@/constants/path";
import { flattenSteps, groupData } from "@/data";

export default function DebuggerPage() {
  const [globalIndex, setGlobalIndex] = useState(0);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {},
  );

  const navigate = useNavigate();

  // 다크 모드 토글
  const [isDarkMode, setIsDarkMode] = useState(false);
  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
    document.documentElement.classList.toggle("dark");
  };

  const currentStep = flattenSteps[globalIndex];
  const stepContainerRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Prev / Next
  const goPrev = () => setGlobalIndex((p) => Math.max(0, p - 1));
  const goNext = () =>
    setGlobalIndex((p) => Math.min(flattenSteps.length - 1, p + 1));

  // Keyboard event (KeyM -> toggle map, arrow keys -> prev/next)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tagName = (e.target as HTMLElement).tagName.toLowerCase();
      if (["input", "textarea", "select"].includes(tagName)) return;

      // 지도 모달 토글: 물리 키 위치가 'KeyM'인 경우
      if (e.code === "KeyM") {
        e.preventDefault();
        setIsMapOpen((prev) => !prev);
        return;
      }

      // Prev
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        goPrev();
        return;
      }

      // Next
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        goNext();
        return;
      }
    };
    window.addEventListener("keydown", handleKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // 현재 Step 바뀌면 해당 Phase 펼치기
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

  // 특정 Step 클릭
  const handleStepClick = (groupId: string, stepIdInGroup: number) => {
    const found = flattenSteps.find(
      (fs) => fs.groupId === groupId && fs.stepIdInGroup === stepIdInGroup,
    );
    if (found) {
      setGlobalIndex(found.globalIndex);
    }
  };

  // Slider onChange
  const handleSliderChange = (val: number[]) => {
    setGlobalIndex(val[0]);
  };

  // 슬라이더 조작 후 포커스 해제
  const handleSliderPointerUp = () => {
    // 한 박자 뒤에 blur 처리
    setTimeout(() => {
      // 현재 포커스가 슬라이더에 있다면 해제
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }, 0);
  };

  // 지도 모달
  const openMap = () => setIsMapOpen(true);

  return (
    <div className="flex flex-col min-h-[calc(100vh-60px)] border border-border rounded overflow-hidden">
      {/* 상단 툴바 */}
      <div className="flex items-center justify-between bg-muted border-b border-border px-4 h-10">
        <div className="flex gap-2 items-center">
          <p className="text-sm font-semibold">Google Search Debugger</p>
        </div>
        <div className="flex gap-2 items-center">
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-muted"
            onClick={openMap}
          >
            지도 (m)
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-muted"
            onClick={toggleDarkMode}
          >
            {isDarkMode ? "Light Mode" : "Dark Mode"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-muted"
            onClick={() => navigate(PATH.ABOUT)}
          >
            About
          </Button>
        </div>
      </div>

      {/* 메인 영역 */}
      <div className="flex flex-1">
        {/* 좌측 Sidebar */}
        <ScrollArea className="w-72 bg-sidebar border-r border-border p-2 flex flex-col">
          {groupData.map((grp) => {
            const isExpanded = expandedGroups[grp.groupId] || false;
            const isCurrentGroup = grp.groupId === currentStep.groupId;

            // Phase 라벨
            let groupLabelClass =
              "flex items-center gap-1 cursor-pointer rounded px-2 py-1 hover:bg-transparent";
            if (isCurrentGroup) {
              groupLabelClass += " font-bold text-primary";
            }

            return (
              <div key={grp.groupId} className="mb-2">
                <div
                  className={groupLabelClass}
                  onClick={() => toggleGroup(grp.groupId)}
                >
                  {isExpanded ? (
                    <IconChevronDown size={16} />
                  ) : (
                    <IconChevronRight size={16} />
                  )}
                  <span className="text-sm">{grp.groupLabel}</span>
                </div>

                {isExpanded && (
                  <div
                    ref={(el) => (stepContainerRefs.current[grp.groupId] = el)}
                    className="ml-5 mt-1 max-h-[280px] overflow-auto flex flex-col gap-1"
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

                      /* 
                        기본: hover:bg-sidebar-active
                        현재 Step: bg-sidebar-active 
                      */
                      let stepClass =
                        "px-2 py-1 rounded text-sm cursor-pointer hover:bg-sidebar-active";

                      if (isActive) {
                        stepClass += " bg-sidebar-active font-medium";
                      }

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

        {/* 우측 Main Panel */}
        <div className="flex-1 flex flex-col p-4">
          <p className="text-sm font-semibold mb-1">
            Current Step: {currentStep.label}
          </p>
          <p className="text-sm text-muted-foreground">{currentStep.desc}</p>

          <Separator className="my-4" />
          <Card className="p-4">
            <p className="text-sm font-medium mb-2">여기에 해당 단계를 표현</p>
            <ul className="list-disc list-inside text-sm text-muted-foreground">
              <li>코드 스니펫, 서버로그, API 응답 등</li>
              <li>직접 조작 예시</li>
            </ul>
          </Card>
        </div>
      </div>

      {/* 하단 Prev/Next + Slider */}
      <div className="border-t border-border px-4 py-2 flex items-center justify-between gap-4">
        <Slider
          className="flex-1"
          max={flattenSteps.length - 1}
          value={[globalIndex]}
          onValueChange={handleSliderChange}
          step={1}
          onPointerUp={handleSliderPointerUp} // pointerUp 시점에 포커스 해제
        />
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
        <span className="text-sm text-muted-foreground w-24 text-right">
          Step {globalIndex + 1} / {flattenSteps.length}
        </span>
      </div>

      {/* 지도 모달 */}
      <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
        <DialogContent
          className="sm:max-w-[600px]"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>지도</DialogTitle>
          </DialogHeader>
          <p className="text-sm mb-2">
            현재 단계: <b>{currentStep.label}</b> ({currentStep.globalIndex + 1}{" "}
            / {flattenSteps.length})
          </p>

          <div className="flex flex-wrap gap-3 border border-border p-3 rounded">
            {groupData.map((grp) => (
              <Tooltip key={grp.groupId} delayDuration={0}>
                <TooltipTrigger>
                  <div
                    className={
                      "cursor-pointer border border-border rounded px-2 py-1 min-w-[120px]" +
                      (grp.groupId === currentStep.groupId
                        ? " bg-secondary text-secondary-foreground"
                        : " bg-card")
                    }
                  >
                    <p className="text-sm font-bold">{grp.groupLabel}</p>
                    <p className="text-xs text-muted-foreground">
                      (Step count: {grp.steps.length})
                    </p>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {/* 마우스 올렸을 때만 보이게, 딜레이 없이 바로 */}
                  <p className="max-w-xs whitespace-pre-wrap">
                    {grp.mapDescription}
                  </p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>

          <div className="text-right mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMapOpen(false)}
            >
              닫기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
