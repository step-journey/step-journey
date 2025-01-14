import { useState, useEffect, useRef } from "react";
import ReactModal from "react-modal";
import {
  Button,
  Group,
  Text,
  Tooltip,
  ScrollArea,
  Paper,
  Divider,
  Slider,
} from "@mantine/core";
import {
  IconPlayerTrackNext,
  IconPlayerTrackPrev,
  IconChevronRight,
  IconChevronDown,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import PATH from "../../constants/path";

import {
  debuggerWrapper,
  toolbar,
  leftActions,
  rightActions,
  contentArea,
  leftPanel,
  mainPanel,
  bottomNav,
  frameItem,
  frameItemActive,
  groupLabel,
} from "./index.css";

import { flattenSteps, groupData } from "../../data";

export default function DebuggerPage() {
  const [globalIndex, setGlobalIndex] = useState(0);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {},
  );

  const navigate = useNavigate();

  const currentStep = flattenSteps[globalIndex];
  const stepContainerRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // -------------------------------------------------------
  // Prev / Next 이동 함수
  // -------------------------------------------------------
  const goPrev = () => setGlobalIndex((p) => Math.max(0, p - 1));
  const goNext = () =>
    setGlobalIndex((p) => Math.min(flattenSteps.length - 1, p + 1));

  // -------------------------------------------------------
  // 키보드 이벤트
  //   - 'KeyM': 지도 모달 토글
  //   - ArrowLeft/ArrowUp: Prev
  //   - ArrowRight/ArrowDown: Next
  // -------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 만약 input, textarea, select 등에 포커스가 있다면 단축키 무시
      const target = e.target as HTMLElement;
      const tagName = target.tagName.toLowerCase();
      if (["input", "textarea", "select"].includes(tagName)) {
        return;
      }

      // 지도 모달 토글: 물리 키 위치가 'KeyM'인 경우
      if (e.code === "KeyM") {
        e.preventDefault(); // 혹시 모를 기본 동작 방지
        // 열려 있으면 닫고, 닫혀 있으면 열기
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
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // -------------------------------------------------------
  // 현재 단계 바뀌면 해당 Phase만 펼치기
  // -------------------------------------------------------
  useEffect(() => {
    setExpandedGroups({ [currentStep.groupId]: true });
  }, [currentStep.groupId]);

  // -------------------------------------------------------
  // 펼쳐진 Phase 내부에서 현재 Step 위치로 스크롤
  // -------------------------------------------------------
  useEffect(() => {
    const gId = currentStep.groupId;
    if (!expandedGroups[gId]) return;

    setTimeout(() => {
      const container = stepContainerRefs.current[gId];
      if (!container) return;

      const stepEl = container.querySelector(
        `#step-${currentStep.globalIndex}`,
      ) as HTMLElement | null;
      if (stepEl) {
        stepEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 0);
  }, [currentStep, expandedGroups]);

  // -------------------------------------------------------
  // Phase 라벨 토글
  // -------------------------------------------------------
  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const isOpen = !!prev[groupId];
      if (isOpen) {
        return { ...prev, [groupId]: false };
      } else {
        return { [groupId]: true };
      }
    });
  };

  // -------------------------------------------------------
  // 특정 Step 클릭 시 globalIndex 변경
  // -------------------------------------------------------
  const handleStepClick = (groupId: string, stepIdInGroup: number) => {
    const found = flattenSteps.find(
      (fs) => fs.groupId === groupId && fs.stepIdInGroup === stepIdInGroup,
    );
    if (found) {
      setGlobalIndex(found.globalIndex);
    }
  };

  // -------------------------------------------------------
  // Slider onChange
  // -------------------------------------------------------
  const handleSliderChange = (val: number) => {
    setGlobalIndex(val);
  };

  // -------------------------------------------------------
  // 지도 모달 열기 / 닫기 (버튼으로도 토글 가능)
  // -------------------------------------------------------
  const openMap = () => setIsMapOpen(true);
  const closeMap = () => setIsMapOpen(false);

  return (
    <div className={debuggerWrapper}>
      {/* 상단 툴바 */}
      <div className={toolbar}>
        <div className={leftActions}>
          <Text fw={600} size="sm">
            Google Search Debugger
          </Text>
        </div>
        <div className={rightActions}>
          {/* 지도 버튼 */}
          <Button variant="subtle" size="xs" onClick={openMap}>
            지도 (m)
          </Button>
          {/* About 버튼: 클릭 시 /about 으로 이동 */}
          <Button
            variant="subtle"
            size="xs"
            onClick={() => navigate(PATH.ABOUT)}
          >
            About
          </Button>
        </div>
      </div>

      {/* 메인 콘텐츠: 좌측 Phase, 우측 현재 Step 상세 */}
      <div className={contentArea}>
        {/* 좌측 Phase 목록 */}
        <ScrollArea className={leftPanel}>
          {groupData.map((grp) => {
            const isExpanded = expandedGroups[grp.groupId] || false;
            const isCurrentGroup = grp.groupId === currentStep.groupId;

            let labelCls = groupLabel.default;
            if (isExpanded && isCurrentGroup) {
              labelCls = groupLabel.activeExpanded;
            } else if (isExpanded) {
              labelCls = groupLabel.expanded;
            } else if (isCurrentGroup) {
              labelCls = groupLabel.activeDefault;
            }

            return (
              <div key={grp.groupId} style={{ marginBottom: "1rem" }}>
                <div
                  className={labelCls}
                  onClick={() => toggleGroup(grp.groupId)}
                >
                  {isExpanded ? (
                    <IconChevronDown size={16} stroke={1.5} />
                  ) : (
                    <IconChevronRight size={16} stroke={1.5} />
                  )}
                  <Text fw={600} size="sm">
                    {grp.groupLabel}
                  </Text>
                </div>

                {isExpanded && (
                  <div
                    style={{
                      marginLeft: "1.5rem",
                      marginTop: "0.25rem",
                      maxHeight: "280px",
                      overflowY: "auto",
                    }}
                    ref={(el) => (stepContainerRefs.current[grp.groupId] = el)}
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

                      return (
                        <div
                          key={st.id}
                          id={`step-${foundFs.globalIndex}`}
                          className={isActive ? frameItemActive : frameItem}
                          onClick={() => handleStepClick(grp.groupId, st.id)}
                        >
                          <Text size="sm" fw={isActive ? 600 : 400}>
                            {st.label}
                          </Text>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </ScrollArea>

        {/* 우측: 현재 Step 상세 */}
        <div className={mainPanel}>
          <Text size="sm" fw={600} mb="xs">
            Current Step: {currentStep.label}
          </Text>
          <Text size="sm" c="dimmed">
            {currentStep.desc}
          </Text>

          <Divider my="sm" />
          <Paper p="sm" shadow="xs" withBorder>
            <Text size="sm" fw={500}>
              여기에 해당 단계를 직관적으로 표현하는 시각화 자료 넣을 예정
            </Text>
            <ul style={{ marginLeft: 16 }}>
              <li>
                코드로 표현하는게 적절한 step 이면 로직을 간단하게 코드로
                구현해서 보여주는 것도 괜찮을듯
              </li>
              <li>HTTP Request / Response</li>
              <li>Server logs (like console output)</li>
              <li>Database queries or external API calls</li>
              <li>“Code snippet” highlight for the current step</li>
            </ul>
          </Paper>
        </div>
      </div>

      {/* 하단: Slider + Prev/Next + Step indicator */}
      <div
        className={bottomNav}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        <div style={{ flex: 1, marginRight: "1rem" }}>
          <Slider
            min={0}
            max={flattenSteps.length - 1}
            value={globalIndex}
            onChange={handleSliderChange}
            styles={{
              track: { margin: "0 1rem" },
            }}
          />
        </div>
        <Group gap="xs" wrap="nowrap">
          <Button
            leftSection={<IconPlayerTrackPrev size={16} />}
            onClick={goPrev}
            variant="outline"
            size="xs"
          >
            Prev
          </Button>
          <Button
            rightSection={<IconPlayerTrackNext size={16} />}
            onClick={goNext}
            variant="outline"
            size="xs"
          >
            Next
          </Button>
        </Group>

        <Text
          size="sm"
          c="dimmed"
          style={{
            width: 90,
            textAlign: "right",
            whiteSpace: "nowrap",
          }}
        >
          Step {globalIndex + 1} / {flattenSteps.length}
        </Text>
      </div>

      {/* 지도 모달 */}
      <ReactModal
        isOpen={isMapOpen}
        onRequestClose={closeMap}
        contentLabel="RPG Map Modal"
        style={{
          content: {
            top: "50%",
            left: "50%",
            right: "auto",
            bottom: "auto",
            transform: "translate(-50%, -50%)",
            width: "600px",
            maxWidth: "90%",
            borderRadius: "8px",
            padding: "1.5rem",
          },
          overlay: {
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          },
        }}
      >
        {/* 모달 내부 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <Text fw="bold" size="md" mb="xs">
            지도
          </Text>
          <Text size="sm">
            현재 단계: <b>{currentStep.label}</b> ({currentStep.globalIndex + 1}{" "}
            / {flattenSteps.length})
          </Text>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "1rem",
              border: "1px solid #ccc",
              padding: "1rem",
              borderRadius: "8px",
            }}
          >
            {groupData.map((grp) => (
              <Tooltip
                key={grp.groupId}
                label={grp.mapDescription}
                multiline
                position="top"
                withArrow
                openDelay={300}
                style={{
                  maxWidth: 400,
                  whiteSpace: "pre-wrap",
                  wordWrap: "break-word",
                }}
              >
                <div
                  style={{
                    cursor: "pointer",
                    border: "1px solid #bbb",
                    borderRadius: "4px",
                    padding: "0.5rem",
                    minWidth: "120px",
                    backgroundColor:
                      grp.groupId === currentStep.groupId ? "#ffc" : "#fff",
                  }}
                >
                  <Text fw="bold" size="sm">
                    {grp.groupLabel}
                  </Text>
                  <Text size="xs" c="dimmed">
                    (Step count: {grp.steps.length})
                  </Text>
                </div>
              </Tooltip>
            ))}
          </div>

          <div style={{ textAlign: "right" }}>
            <Button onClick={closeMap} size="xs" variant="outline">
              닫기
            </Button>
          </div>
        </div>
      </ReactModal>
    </div>
  );
}
