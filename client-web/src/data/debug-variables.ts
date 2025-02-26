import { DebugVariable, FlattenedStep } from "@/types/journey";

// 현재 단계에 따라 변수 가져오기
export function getDebugVariablesForStep(step: FlattenedStep): DebugVariable[] {
  // 기본 공통 변수
  const commonVariables: DebugVariable[] = [
    {
      name: "currentStep",
      value: null,
      type: "object",
      expanded: true,
      children: [
        { name: "id", value: step.id, type: "number" },
        { name: "label", value: step.label, type: "string" },
        { name: "globalIndex", value: step.globalIndex, type: "number" },
        { name: "groupId", value: step.groupId, type: "string" },
      ],
    },
  ];

  const stepVariables = step.debugVariables || [];

  return [...commonVariables, ...stepVariables];
}
