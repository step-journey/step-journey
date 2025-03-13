import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { devtools } from "zustand/middleware";
import { Block } from "../types";

/**
 * 블록 관련 공통 상태와 액션을 관리하는 스토어
 * - 모든 블록 데이터
 * - 현재 활성화된 스텝 인덱스
 */
interface BlockState {
  allBlocks: Block[]; // 모든 블록 목록
  currentStepIndex: number; // 현재 활성화된 스텝 인덱스
}

interface BlockActions {
  setAllBlocks: (blocks: Block[]) => void; // 모든 블록 설정
  setCurrentStepIndex: (index: number) => void; // 현재 스텝 인덱스 변경
  nextStep: () => void; // 다음 스텝으로 이동
  prevStep: () => void; // 이전 스텝으로 이동
}

export const useBlockStore = create<BlockState & BlockActions>()(
  devtools(
    immer((set, get) => ({
      // 상태
      allBlocks: [],
      currentStepIndex: 0,

      // 액션
      setAllBlocks: (blocks) =>
        set((state) => {
          state.allBlocks = blocks;
        }),

      setCurrentStepIndex: (index) =>
        set((state) => {
          state.currentStepIndex = index;
        }),

      nextStep: () =>
        set((state) => {
          // 전체 블록 수 확인 로직 필요 시 추가
          const maxIndex =
            get().allBlocks.filter((b) => b.type === "step").length - 1;
          state.currentStepIndex = Math.min(
            state.currentStepIndex + 1,
            maxIndex,
          );
        }),

      prevStep: () =>
        set((state) => {
          state.currentStepIndex = Math.max(0, state.currentStepIndex - 1);
        }),
    })),
    { name: "block-store" },
  ),
);

// 선택자 함수 - 불필요한 리렌더링 방지
export const useAllBlocks = () => useBlockStore((state) => state.allBlocks);
export const useCurrentStepIndex = () =>
  useBlockStore((state) => state.currentStepIndex);
export const useNextStep = () => useBlockStore((state) => state.nextStep);
export const usePrevStep = () => useBlockStore((state) => state.prevStep);
