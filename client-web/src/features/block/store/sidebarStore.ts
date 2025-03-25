import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { devtools } from "zustand/middleware";
import { Block, BlockType } from "../types";

/**
 * 스텝 클릭 핸들러 타입 - StepID로 직접 핸들링
 */
type StepClickHandler = (stepId: string) => void;

/**
 * 사이드바 관련 상태와 액션을 관리하는 스토어
 */
interface SidebarState {
  expandedGroups: Record<string, boolean>; // 펼쳐진 그룹 목록
  currentStepId?: string; // 현재 활성화된 스텝 ID
  prevStepGroupId?: string; // 이전 스텝의 그룹 ID
  currentStepGroupId?: string; // 현재 스텝이 속한 그룹 ID
  stepClickHandler: StepClickHandler; // 스텝 클릭 핸들러
}

interface SidebarActions {
  toggleGroup: (groupId: string) => void; // 그룹 펼치기/접기 토글
  setCurrentStepId: (stepId: string | undefined) => void; // 현재 스텝 ID 설정
  setCurrentStepGroupId: (groupId: string | undefined) => void; // 현재 스텝 그룹 ID 설정
  setStepClickHandler: (handler: StepClickHandler) => void; // 스텝 클릭 핸들러 설정
  handleStepClick: (stepId: string) => void; // 스텝 클릭 처리
  expandGroup: (groupId: string) => void; // 특정 그룹 펼치기
  collapseGroup: (groupId: string) => void; // 특정 그룹 접기
  expandAllGroups: () => void; // 모든 그룹 펼치기
  collapseAllGroups: () => void; // 모든 그룹 접기
  updateGroupsForCurrentStep: (
    currentStepId: string | undefined,
    allBlocks: Block[],
  ) => void; // 현재 스텝에 따라 그룹 상태 업데이트
}

export const useSidebarStore = create<SidebarState & SidebarActions>()(
  devtools(
    immer((set, get) => ({
      // 상태
      expandedGroups: {},
      currentStepId: undefined,
      prevStepGroupId: undefined,
      currentStepGroupId: undefined,
      stepClickHandler: () => {}, // 기본 빈 핸들러

      // 액션
      toggleGroup: (groupId) =>
        set((state) => {
          // 그룹 상태 토글
          state.expandedGroups[groupId] = !state.expandedGroups[groupId];
        }),

      setCurrentStepId: (stepId) =>
        set((state) => {
          state.currentStepId = stepId;
        }),

      setCurrentStepGroupId: (groupId) =>
        set((state) => {
          state.currentStepGroupId = groupId;
        }),

      setStepClickHandler: (handler) =>
        set((state) => {
          state.stepClickHandler = handler;
        }),

      handleStepClick: (stepId) => {
        get().stepClickHandler(stepId);
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

      // current step 에 따라 step group 상태 업데이트
      updateGroupsForCurrentStep: (currentStepId, allBlocks) =>
        set((state) => {
          if (!currentStepId || allBlocks.length === 0) return;

          // 1. current step block 찾기
          const currentStep = allBlocks.find(
            (block) => block.id === currentStepId,
          );
          if (!currentStep) return;

          // 2. 현재 step 의 step group ID 가져오기
          const currentStepGroupId = currentStep.parentId;
          if (!currentStepGroupId) return;

          // 현재 스텝의 그룹 ID 업데이트
          state.currentStepGroupId = currentStepGroupId;

          // 3. 이전 그룹 ID와 현재 그룹 ID가 다른 경우에만 접기/펼치기 동작 수행
          if (currentStepGroupId !== state.prevStepGroupId) {
            // 3-1. 모든 step group 접기
            const allStepGroupIds = allBlocks
              .filter((block) => block.type === BlockType.STEP_GROUP)
              .map((block) => block.id);

            allStepGroupIds.forEach((groupId) => {
              state.expandedGroups[groupId] = false;
            });

            // 3-2. 현재 step group 만 펼치기
            state.expandedGroups[currentStepGroupId] = true;

            // 3-3. 이전 그룹 ID 업데이트
            state.prevStepGroupId = currentStepGroupId;
          }
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
export const useCurrentStepGroupId = () =>
  useSidebarStore((state) => state.currentStepGroupId);
export const useToggleGroup = () =>
  useSidebarStore((state) => state.toggleGroup);
export const useHandleStepClick = () =>
  useSidebarStore((state) => state.handleStepClick);
export const useUpdateGroupsForCurrentStep = () =>
  useSidebarStore((state) => state.updateGroupsForCurrentStep);
