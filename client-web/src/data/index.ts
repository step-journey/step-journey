import cubicProblem from "./cubic-problem.json";
import { FlattenedStep, Journey } from "@/types/journey";
import cubicProblemImage from "./cubic-problem.png";

// 실제 데이터
export const journeys: Journey[] = [
  {
    id: "cubic-problem", // 새 항목 추가
    title: "삼차함수 B - A 문제 풀이",
    description: "미적분/정적분을 이용하여 넓이 차이를 구하는 문제",
    pinnedProblem: {
      text: cubicProblem.pinnedProblem as string,
      media: {
        type: "image",
        url: cubicProblemImage,
        alt: "삼차함수 그래프 문제",
        caption: "",
      },
    },
    groups: [cubicProblem.groups[0]],
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

  journey.groups.forEach((group) => {
    group.steps.forEach((step) => {
      result.push({
        ...step,
        groupId: group.groupId,
        globalIndex,
        stepIdInGroup: step.id,
      });
      globalIndex++;
    });
  });

  return result;
};
