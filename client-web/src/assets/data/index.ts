import cubicProblem from "./cubic-problem.json";
import {
  FlattenedStep,
  Journey,
  Step,
  StepGroup,
} from "@/features/journey/types/journey";
import cubicProblemImage from "../images/cubic-problem.png";

export const journeys: Journey[] = [
  {
    id: cubicProblem.id,
    title: cubicProblem.title,
    description: cubicProblem.description,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pinnedProblem: {
      text: cubicProblem.pinnedProblem as string,
      media: {
        type: "image",
        url: cubicProblemImage,
        alt: "삼차함수 그래프 문제",
        caption: "",
      },
    },
    stepGroups: cubicProblem.stepGroups.map((stepGroup) => ({
      groupLabel: stepGroup.groupLabel,
      steps: stepGroup.steps.map((step) => {
        const timestamp = new Date().toISOString();
        // 먼저 unknown 으로 변환 후 올바른 타입으로 캐스팅
        const transformedStep = {
          ...step,
          id: String(step.id),
          journeyId: cubicProblem.id,
          title: step.label || `Step ${step.id}`,
          createdBy: "system",
          createdAt: timestamp,
          updatedAt: timestamp,
          // 배열이면 그대로, 문자열이면 배열로 변환
          content: Array.isArray(step.content)
            ? step.content
            : step.content
              ? [step.content]
              : [],
        };
        return transformedStep as unknown as Step;
      }),
    })) as StepGroup[],
  },
];

// 특정 Journey 가져오기 (ID로)
export const getJourneyById = (id: string): Journey | undefined => {
  return journeys.find((journey) => journey.id === id);
};

// 특정 Journey 의 단계 데이터 평탄화하기
export const flattenJourneySteps = (journey: Journey): FlattenedStep[] => {
  const result: FlattenedStep[] = [];
  let globalIndex = 0;

  // groups 가 정의되어 있지 않거나 배열이 아닌 경우 빈 배열 반환
  if (!journey.stepGroups || !Array.isArray(journey.stepGroups)) {
    console.warn("Journey has no valid groups array");
    return result;
  }

  journey.stepGroups.forEach((group) => {
    // steps 가 정의되어 있지 않거나 배열이 아닌 경우 건너뛰기
    if (!group.steps || !Array.isArray(group.steps)) {
      console.warn(`Group ${group.groupId} has no valid steps array`);
      return;
    }

    group.steps.forEach((step) => {
      result.push({
        ...step,
        groupId: group.groupId,
        globalIndex,
        stepIdInGroup: Number(step.id),
        content: Array.isArray(step.content)
          ? step.content
          : step.content
            ? [step.content]
            : [],
      });
      globalIndex++;
    });
  });

  return result;
};
