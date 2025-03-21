import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { devtools } from "zustand/middleware";
import { Block } from "../types";

/**
 * 블록 관련 공통 상태와 액션을 관리하는 스토어
 * - 모든 블록 데이터
 * - 현재 활성화된 스텝 정렬 순서
 */
interface BlockState {
  allBlocks: Block[]; // 모든 블록 목록
  currentStepOrder: number; // 현재 활성화된 스텝 정렬 순서
}

interface BlockActions {
  setAllBlocks: (blocks: Block[]) => void; // 모든 블록 설정
  setCurrentStepOrder: (order: number) => void; // 현재 스텝 정렬 순서 변경
}

export const useBlockStore = create<BlockState & BlockActions>()(
  devtools(
    immer((set) => ({
      // 상태
      allBlocks: [],
      currentStepOrder: 0,

      // 액션
      setAllBlocks: (blocks) =>
        set((state) => {
          state.allBlocks = blocks;
        }),

      setCurrentStepOrder: (order) =>
        set((state) => {
          state.currentStepOrder = order;
        }),
    })),
    { name: "block-store" },
  ),
);

// 선택자 함수 - 불필요한 리렌더링 방지
export const useAllBlocks = () => useBlockStore((state) => state.allBlocks);
export const useCurrentStepOrder = () =>
  useBlockStore((state) => state.currentStepOrder);
