import cubicProblem from "./cubic-problem.json";
import { FlattenedStep, Journey, Step } from "@/types/journey";
import cubicProblemImage from "./cubic-problem.png";

// 각 단계별 관련 키워드 정의
const stepKeywords: Record<number, string[]> = {
  1: ["최고차항의 계수가 1인 삼차함수"], // 1단계: 일반형 설정
  2: ["f(1) = f(2) = 0", "f'(0) = -7"], // 2단계: 주어진 조건을 식으로 세우기
  3: ["f(1) = f(2) = 0", "f'(0) = -7"], // 3단계: a와 c 구하기
  4: [],
  5: ["P(3, f(3))"], // 5단계: 점 P 구하기
  6: ["원점 O", "P(3, f(3))"], // 6단계: 직선 OP의 방정식
  7: ["선분 OP", "곡선 y = f(x)와 만나는 점", "P가 아닌 점을 Q"], // 7단계: 점 Q 좌표 찾기
  8: ["곡선 y = f(x)", "선분", "둘러싸인 부분의 넓이", "A", "B"], // 8단계: 넓이 A와 B 정의
  9: ["B - A"], // 9단계: B-A를 하나의 적분으로 합치기
  10: ["B - A"], // 10단계: 각각의 적분 계산
  11: ["B - A의 값"], // 11단계: 최종값 구하기
};

// 각 단계에 관련 키워드 추가
const enrichSteps = (steps: Step[]): Step[] => {
  return steps.map((step) => {
    const stepId = step.id;
    if (stepKeywords[stepId]) {
      return {
        ...step,
        relatedKeywords: stepKeywords[stepId],
      };
    }
    return step;
  });
};

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
    groups: [
      {
        ...cubicProblem.groups[0],
        steps: enrichSteps(cubicProblem.groups[0].steps),
      },
    ],
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
