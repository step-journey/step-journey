import { FlattenedStep } from "@/types/journey";

interface ChatbotFlowDiagramProps {
  currentStep: FlattenedStep;
  allSteps: FlattenedStep[];
}

export function ChatbotFlowDiagram({
  currentStep,
  allSteps,
}: ChatbotFlowDiagramProps) {
  // 그룹 ID별로 스텝 분류
  const stepsByGroup: Record<string, FlattenedStep[]> = {};

  allSteps.forEach((step) => {
    if (!stepsByGroup[step.groupId]) {
      stepsByGroup[step.groupId] = [];
    }
    stepsByGroup[step.groupId].push(step);
  });

  // 고유 그룹 ID 목록 (순서대로)
  const groupIds = Object.keys(stepsByGroup);

  // 그룹 라벨 추출 (예: "simple-chat-phase1" -> "Phase 1")
  const groupLabels: Record<string, string> = {};
  groupIds.forEach((groupId) => {
    const match = groupId.match(/phase(\d+)/i);
    if (match && match[1]) {
      groupLabels[groupId] = `Phase ${match[1]}`;
    } else {
      groupLabels[groupId] = groupId;
    }
  });

  // 위치 계산
  const positions = calculatePositions(stepsByGroup, groupIds);

  return (
    <div className="w-full h-full">
      <svg
        className="w-full h-full"
        viewBox="0 0 1000 600"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* 그룹 배경 */}
        {groupIds.map((groupId) => (
          <rect
            key={`group-bg-${groupId}`}
            x={positions.groups[groupId].x}
            y={positions.groups[groupId].y - 20}
            width={positions.groups[groupId].width}
            height={positions.groups[groupId].height + 40}
            fill="#f8fafc"
            rx="8"
            ry="8"
          />
        ))}

        {/* 그룹 라벨 */}
        {groupIds.map((groupId) => (
          <text
            key={`group-${groupId}`}
            x={
              positions.groups[groupId].x + positions.groups[groupId].width / 2
            }
            y={positions.groups[groupId].y - 30}
            textAnchor="middle"
            fill="#64748b"
            fontSize="16"
            fontWeight="bold"
          >
            {groupLabels[groupId]}
          </text>
        ))}

        {/* 스텝 간 연결선 */}
        {allSteps.map((step, index) => {
          if (index < allSteps.length - 1) {
            const currentPos =
              positions.steps[`${step.groupId}-${step.stepIdInGroup}`];
            const nextStep = allSteps[index + 1];
            const nextPos =
              positions.steps[`${nextStep.groupId}-${nextStep.stepIdInGroup}`];

            return (
              <line
                key={`connection-${index}`}
                x1={currentPos.x + 120} // 노드 너비
                y1={currentPos.y + 40} // 노드 높이의 절반
                x2={nextPos.x}
                y2={nextPos.y + 40}
                stroke={
                  step.globalIndex === currentStep.globalIndex
                    ? "#3b82f6"
                    : "#cbd5e1"
                }
                strokeWidth="2"
                markerEnd={
                  step.globalIndex === currentStep.globalIndex
                    ? "url(#arrowhead-active)"
                    : "url(#arrowhead)"
                }
              />
            );
          }
          return null;
        })}

        {/* 화살표 마커 정의 */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#cbd5e1" />
          </marker>
          <marker
            id="arrowhead-active"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
          </marker>
        </defs>

        {/* 스텝 노드 */}
        {allSteps.map((step) => {
          const isCurrentStep = step.globalIndex === currentStep.globalIndex;
          const pos = positions.steps[`${step.groupId}-${step.stepIdInGroup}`];

          return (
            <g
              key={`node-${step.groupId}-${step.stepIdInGroup}`}
              transform={`translate(${pos.x}, ${pos.y})`}
            >
              <rect
                width="240"
                height="80"
                rx="8"
                ry="8"
                fill={isCurrentStep ? "#3b82f6" : "#ffffff"}
                stroke={isCurrentStep ? "#2563eb" : "#cbd5e1"}
                strokeWidth="2"
              />
              <text
                x="120"
                y="45"
                textAnchor="middle"
                fill={isCurrentStep ? "white" : "#475569"}
                fontSize="14"
              >
                {step.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// 위치 계산 헬퍼 함수
function calculatePositions(
  stepsByGroup: Record<string, FlattenedStep[]>,
  groupIds: string[],
) {
  const positions = {
    groups: {} as Record<
      string,
      { x: number; y: number; width: number; height: number }
    >,
    steps: {} as Record<string, { x: number; y: number }>,
  };

  // 그룹 위치 계산
  const groupWidth = 1000 / groupIds.length;

  groupIds.forEach((groupId, index) => {
    positions.groups[groupId] = {
      x: index * groupWidth + 10, // 여백 추가
      y: 80, // 그룹 라벨 아래
      width: groupWidth - 20, // 여백 제외
      height: 500,
    };

    // 그룹 내 스텝 위치 계산
    const stepsInGroup = stepsByGroup[groupId];
    const stepHeight = 450 / Math.max(stepsInGroup.length, 1);

    stepsInGroup.forEach((step, stepIndex) => {
      positions.steps[`${step.groupId}-${step.stepIdInGroup}`] = {
        x:
          positions.groups[groupId].x +
          (positions.groups[groupId].width - 240) / 2, // 그룹 내 중앙 정렬
        y: positions.groups[groupId].y + 20 + stepIndex * stepHeight,
      };
    });
  });

  return positions;
}
