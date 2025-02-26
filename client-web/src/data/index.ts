import phase1 from "./phase1.json";
import phase2 from "./phase2.json";
import phase3 from "./phase3.json";
import phase4 from "./phase4.json";
import phase5 from "./phase5.json";
import llmPhase1 from "./llm-phase1.json";
import llmPhase2 from "./llm-phase2.json";
import llmPhase3 from "./llm-phase3.json";
import llmPhase4 from "./llm-phase4.json";
import simpleChatbotPhase1 from "./simple-chatbot-phase1.json";
import simpleChatbotPhase2 from "./simple-chatbot-phase2.json";
import simpleChatbotPhase3 from "./simple-chatbot-phase3.json";
import simpleChatbotPhase4 from "./simple-chatbot-phase4.json";
import { Journey, FlattenedStep, GroupData } from "@/types/journey";

// Google Search Journey
const googleSearchJourney: Journey = {
  id: "google-search",
  title: "Google Search Journey",
  description: "구글 검색 처리 과정",
  groups: [phase1, phase2, phase3, phase4, phase5],
};

// LLM Processing Journey
const llmProcessingJourney: Journey = {
  id: "llm-processing",
  title: "LLM Processing Journey",
  description: "LLM이 입력 토큰을 출력 토큰으로 변환하는 과정",
  groups: [llmPhase1, llmPhase2, llmPhase3, llmPhase4],
};

// Simple Chatbot Journey
const simpleChatbot: Journey = {
  id: "simple-chatbot",
  title: "Simple Chat Journey",
  description: "간단한 챗봇 처리 과정",
  groups: [
    simpleChatbotPhase1,
    simpleChatbotPhase2,
    simpleChatbotPhase3,
    simpleChatbotPhase4,
  ],
};

export const journeys: Journey[] = [
  googleSearchJourney,
  llmProcessingJourney,
  simpleChatbot,
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

// 기존 함수들은 내부적으로 위의 함수들을 활용하도록 수정
// 이 함수들은 호환성을 위해 유지
export const groupData: GroupData[] = googleSearchJourney.groups;
export const flattenSteps = flattenJourneySteps(googleSearchJourney);
