import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { devtools } from "zustand/middleware";
import { FlattenedBlock } from "../types";

/**
 * 콘텐츠 영역 관련 상태와 액션을 관리하는 스토어
 * - 현재 단계
 * - 모든 단계 목록
 * - 키워드 강조 설정
 */
interface ContentState {
  currentStep: FlattenedBlock | null; // 현재 활성화된 스텝
  allSteps: FlattenedBlock[]; // 모든 스텝 목록
  highlightKeywords: boolean; // 키워드 강조 여부
}

interface ContentActions {
  setCurrentStep: (step: FlattenedBlock | null) => void; // 현재 스텝 설정
  setAllSteps: (steps: FlattenedBlock[]) => void; // 모든 스텝 설정
  setHighlightKeywords: (highlight: boolean) => void; // 키워드 강조 설정
  updateState: (partial: Partial<ContentState>) => void; // 여러 상태 동시 업데이트
}

export const useContentStore = create<ContentState & ContentActions>()(
  devtools(
    immer((set) => ({
      // 상태
      currentStep: null,
      allSteps: [],
      highlightKeywords: true,

      // 액션
      setCurrentStep: (step) =>
        set((state) => {
          state.currentStep = step;
        }),

      setAllSteps: (steps) =>
        set((state) => {
          state.allSteps = steps;
        }),

      setHighlightKeywords: (highlight) =>
        set((state) => {
          state.highlightKeywords = highlight;
        }),

      updateState: (partial) =>
        set((state) => {
          // 부분 상태 업데이트 - 여러 값을 한번에 변경할 때 유용
          Object.assign(state, partial);
        }),
    })),
    { name: "content-store" },
  ),
);

// 선택자 함수
export const useCurrentStep = () =>
  useContentStore((state) => state.currentStep);
export const useAllSteps = () => useContentStore((state) => state.allSteps);
export const useHighlightKeywords = () =>
  useContentStore((state) => state.highlightKeywords);
