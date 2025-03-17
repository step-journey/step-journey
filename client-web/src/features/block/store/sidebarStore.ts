import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { devtools } from "zustand/middleware";
import { Block, BlockType } from "../types";

/**
 * 스텝 클릭 핸들러 타입
 */
type StepClickHandler = (groupId: string, stepIdInGroup: number) => void;

/**
 * 사이드바 관련 상태와 액션을 관리하는 스토어
 */
interface SidebarState {
  expandedGroups: Record<string, boolean>; // 펼쳐진 그룹 목록
  userToggledGroups: Record<string, boolean>; // 사용자가 명시적으로 토글한 그룹 기록
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
  updateGroupsForCurrentStep: (
    currentStepId: string | undefined,
    allBlocks: Block[],
  ) => void; // 새로 추가
  resetUserToggledGroups: () => void; // 사용자 토글 기록 초기화
}

export const useSidebarStore = create<SidebarState & SidebarActions>()(
  devtools(
    immer((set, get) => ({
      // 상태
      expandedGroups: {},
      userToggledGroups: {}, // 사용자 토글 기록 추가
      currentStepId: undefined,
      stepClickHandler: () => {}, // 기본 빈 핸들러

      // 액션
      toggleGroup: (groupId) =>
        set((state) => {
          // 그룹 상태 토글
          state.expandedGroups[groupId] = !state.expandedGroups[groupId];

          // 사용자가 명시적으로 토글했음을 기록
          state.userToggledGroups[groupId] = true;
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
          // 명시적 확장 기록
          state.userToggledGroups[groupId] = true;
        }),

      collapseGroup: (groupId) =>
        set((state) => {
          state.expandedGroups[groupId] = false;
          // 명시적 축소 기록
          state.userToggledGroups[groupId] = true;
        }),

      expandAllGroups: () =>
        set((state) => {
          Object.keys(state.expandedGroups).forEach((groupId) => {
            state.expandedGroups[groupId] = true;
            // 모든 그룹을 사용자가 토글한 것으로 기록
            state.userToggledGroups[groupId] = true;
          });
        }),

      collapseAllGroups: () =>
        set((state) => {
          Object.keys(state.expandedGroups).forEach((groupId) => {
            state.expandedGroups[groupId] = false;
            // 모든 그룹을 사용자가 토글한 것으로 기록
            state.userToggledGroups[groupId] = true;
          });
        }),

      // 사용자 토글 기록 초기화
      resetUserToggledGroups: () =>
        set((state) => {
          state.userToggledGroups = {};
        }),

      // current step 에 따라 step group 상태 업데이트 - 수정
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

          // 3. 모든 step group ID 찾기
          const allStepGroupIds = allBlocks
            .filter((block) => block.type === BlockType.STEP_GROUP)
            .map((block) => block.id);

          // 4. 사용자가 명시적으로 토글하지 않은 step group 만 자동으로 접기
          allStepGroupIds.forEach((groupId) => {
            // 사용자가 명시적으로 토글하지 않은 경우에만 자동으로 접기
            if (!state.userToggledGroups[groupId]) {
              state.expandedGroups[groupId] = false;
            }
          });

          // 5. 현재 step group 은 사용자가 명시적으로 접지 않았다면 자동으로 펼치기
          if (!state.userToggledGroups[currentStepGroupId]) {
            state.expandedGroups[currentStepGroupId] = true;
          }
          // 만약 사용자가 명시적으로 접었다가 다시 새로운 단계로 이동한다면?
          // 여기서는 userToggledGroups 를 유지 - 사용자가 접은 상태를 존중
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
export const useUpdateGroupsForCurrentStep = () =>
  useSidebarStore((state) => state.updateGroupsForCurrentStep);
export const useResetUserToggledGroups = () =>
  useSidebarStore((state) => state.resetUserToggledGroups);
