import cubicProblem from "./cubic-problem.json";
import { FlattenedStep, Journey, Step } from "@/features/journey/types/journey";
import cubicProblemImage from "../images/cubic-problem.png";

export const journeys: Journey[] = [
  {
    id: "cubic-problem", // 새 항목 추가
    title: cubicProblem.title,
    description: cubicProblem.description,
    step_order: [], // 필수 속성 추가
    created_at: new Date().toISOString(), // 필수 속성 추가
    updated_at: new Date().toISOString(), // 필수 속성 추가
    pinnedProblem: {
      text: cubicProblem.pinnedProblem as string,
      media: {
        type: "image",
        url: cubicProblemImage,
        alt: "삼차함수 그래프 문제",
        caption: "",
      },
    },
    groups: cubicProblem.groups.map((group) => ({
      ...group,
      steps: group.steps.map(
        (step) =>
          ({
            ...step,
            content: step.content || [], // content가 undefined면 빈 배열로 설정
          }) as Step,
      ),
    })),
  },
];

// 특정 Journey 가져오기 (ID로)
export const getJourneyById = (id: string): Journey | undefined => {
  return journeys.find((journey) => journey.id === id);
};

// 특정 Journey의 단계 데이터 평탄화하기
export const flattenJourneySteps = (journey: Journey): FlattenedStep[] => {
  const result: FlattenedStep[] = [];
  let globalIndex = 0;

  // groups가 정의되어 있지 않거나 배열이 아닌 경우 빈 배열 반환
  if (!journey.groups || !Array.isArray(journey.groups)) {
    console.warn("Journey has no valid groups array");
    return result;
  }

  journey.groups.forEach((group) => {
    // steps가 정의되어 있지 않거나 배열이 아닌 경우 건너뛰기
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
        content: step.content || [], // content가 undefined면 빈 배열로 설정
      });
      globalIndex++;
    });
  });

  return result;
};
