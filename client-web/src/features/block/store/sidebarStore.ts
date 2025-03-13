import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { devtools } from "zustand/middleware";

/**
 * 스텝 클릭 핸들러 타입
 */
type StepClickHandler = (groupId: string, stepIdInGroup: number) => void;

/**
 * 사이드바 관련 상태와 액션을 관리하는 스토어
 * - 펼쳐진 그룹 목록
 * - 현재 활성화된 스텝 ID
 * - 스텝 클릭 핸들러
 */
interface SidebarState {
  expandedGroups: Record<string, boolean>; // 펼쳐진 그룹 목록
  currentStepId?: string; // 현재 활성화된 스텝 ID
  stepClickHandler: StepClickHandler; // 스텝 클릭 핸들러
}

interface SidebarActions {
  toggleGroup: (groupId: string) => void; // 그룹 펼치기/접기 토글
  setCurrentStepId: (stepId: string | undefined) => void; // 현재 스텝 ID 설정
  setStepClickHandler: (handler: StepClickHandler) => void; // 스텝 클릭 핸들러 설정
  handleStepClick: (groupId: string, stepIdInGroup: number) => void; // 스텝 클릭 처리
  expandGroup: (groupId: string) => void; // 특정 그룹 펼치기
  collapseGroup: (groupId: string) => void; // 특정 그룹 접기
  expandAllGroups: () => void; // 모든 그룹 펼치기
  collapseAllGroups: () => void; // 모든 그룹 접기
}

export const useSidebarStore = create<SidebarState & SidebarActions>()(
  devtools(
    immer((set, get) => ({
      // 상태
      expandedGroups: {},
      currentStepId: undefined,
      stepClickHandler: () => {}, // 기본 빈 핸들러

      // 액션
      toggleGroup: (groupId) =>
        set((state) => {
          state.expandedGroups[groupId] = !state.expandedGroups[groupId];
        }),

      setCurrentStepId: (stepId) =>
        set((state) => {
          state.currentStepId = stepId;
        }),

      setStepClickHandler: (handler) =>
        set((state) => {
          state.stepClickHandler = handler;
        }),

      handleStepClick: (groupId, stepIdInGroup) => {
        // 현재 저장된 핸들러 실행
        get().stepClickHandler(groupId, stepIdInGroup);
      },

      expandGroup: (groupId) =>
        set((state) => {
          state.expandedGroups[groupId] = true;
        }),

      collapseGroup: (groupId) =>
        set((state) => {
          state.expandedGroups[groupId] = false;
        }),

      expandAllGroups: () =>
        set((state) => {
          // 모든 그룹 ID는 외부에서 제공해야 함
          // 일단 현재 알고 있는 그룹들만 처리
          Object.keys(state.expandedGroups).forEach((groupId) => {
            state.expandedGroups[groupId] = true;
          });
        }),

      collapseAllGroups: () =>
        set((state) => {
          Object.keys(state.expandedGroups).forEach((groupId) => {
            state.expandedGroups[groupId] = false;
          });
        }),
    })),
    { name: "sidebar-store" },
  ),
);

// 선택자 함수
export const useExpandedGroups = () =>
  useSidebarStore((state) => state.expandedGroups);
export const useCurrentStepId = () =>
  useSidebarStore((state) => state.currentStepId);
export const useToggleGroup = () =>
  useSidebarStore((state) => state.toggleGroup);
export const useHandleStepClick = () =>
  useSidebarStore((state) => state.handleStepClick);
