import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { devtools } from "zustand/middleware";
import { toast } from "sonner";
import * as journeyService from "@/features/journey/services/journeyService";
import { FlattenedBlock, Block, JourneyBlock } from "@/features/journey/types";

// 상태 인터페이스 정의
interface JourneyState {
  // Journey 목록 관련 상태
  journeyBlocks: JourneyBlock[];
  isLoadingJourneys: boolean;
  journeysError: string | null;

  // 현재 활성화된 Journey 관련 상태
  currentJourneyBlock: JourneyBlock | null;
  isLoadingCurrentJourney: boolean;
  currentJourneyError: string | null;
  flattenedSteps: FlattenedBlock[];
  allBlocks: Block[];
  currentStepIndex: number;
  expandedGroups: Record<string, boolean>;
}

// 액션 인터페이스 정의
interface JourneyActions {
  // Journey 목록 관련 액션
  loadJourneys: () => Promise<void>;

  // 단일 Journey 관련 액션
  loadJourney: (id: string) => Promise<void>;
  setCurrentStepIndex: (index: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  toggleGroup: (groupId: string) => void;

  // 에러 처리
  clearJourneysError: () => void;
  clearCurrentJourneyError: () => void;
}

// 초기 상태 정의
const initialState: JourneyState = {
  journeyBlocks: [],
  isLoadingJourneys: false,
  journeysError: null,

  currentJourneyBlock: null,
  isLoadingCurrentJourney: false,
  currentJourneyError: null,
  flattenedSteps: [],
  allBlocks: [],
  currentStepIndex: 0,
  expandedGroups: {},
};

// Zustand 스토어 생성
export const useJourneyStore = create<JourneyState & JourneyActions>()(
  devtools(
    immer((set, get) => ({
      ...initialState,

      // 액션 구현
      loadJourneys: async () => {
        set((state) => {
          state.isLoadingJourneys = true;
          state.journeysError = null;
        });

        try {
          // DB 초기화
          await journeyService.initializeDatabase();

          // DB와 정적 데이터에서 Journey 목록 로드
          const journeyBlocks = await journeyService.getCombinedJourneys();

          set((state) => {
            state.journeyBlocks = journeyBlocks;
            state.isLoadingJourneys = false;
          });
        } catch (error) {
          console.error("Failed to load journeys:", error);
          const errorMessage =
            "Journey 목록을 불러오는 중 오류가 발생했습니다.";

          toast.error(errorMessage);

          set((state) => {
            state.isLoadingJourneys = false;
            state.journeysError = errorMessage;
          });
        }
      },

      loadJourney: async (id) => {
        set((state) => {
          state.isLoadingCurrentJourney = true;
          state.currentJourneyError = null;
        });

        try {
          const { journeyBlock, flattenedSteps, allBlocks } =
            await journeyService.loadJourneyWithSteps(id);

          if (!journeyBlock) {
            const errorMessage = "Journey를 찾을 수 없습니다.";
            toast.error(errorMessage);

            set((state) => {
              state.currentJourneyError = errorMessage;
              state.isLoadingCurrentJourney = false;
            });
            return;
          }

          // 첫 번째 그룹 펼치기
          const expandedGroups: Record<string, boolean> = {};
          if (flattenedSteps.length > 0) {
            const firstStep = flattenedSteps[0];
            if (firstStep.parentId) {
              expandedGroups[firstStep.parentId] = true;
            }
          }

          set((state) => {
            state.currentJourneyBlock = journeyBlock;
            state.flattenedSteps = flattenedSteps;
            state.allBlocks = allBlocks;
            state.currentStepIndex = 0;
            state.expandedGroups = expandedGroups;
            state.isLoadingCurrentJourney = false;
          });
        } catch (error) {
          console.error("Failed to load journey:", error);
          const errorMessage = "Journey를 불러오는 중 오류가 발생했습니다.";

          toast.error(errorMessage);

          set((state) => {
            state.currentJourneyError = errorMessage;
            state.isLoadingCurrentJourney = false;
          });
        }
      },

      setCurrentStepIndex: (index) => {
        const { flattenedSteps } = get();
        if (index >= 0 && index < flattenedSteps.length) {
          set((state) => {
            state.currentStepIndex = index;

            // 현재 단계가 속한 그룹을 펼침
            const currentStep = flattenedSteps[index];
            if (currentStep && currentStep.parentId) {
              state.expandedGroups[currentStep.parentId] = true;
            }
          });
        }
      },

      nextStep: () => {
        const { currentStepIndex, flattenedSteps } = get();
        const maxIndex = flattenedSteps.length - 1;
        const newIndex = Math.min(
          currentStepIndex + 1,
          maxIndex >= 0 ? maxIndex : 0,
        );
        get().setCurrentStepIndex(newIndex);
      },

      prevStep: () => {
        const { currentStepIndex } = get();
        const newIndex = Math.max(0, currentStepIndex - 1);
        get().setCurrentStepIndex(newIndex);
      },

      toggleGroup: (groupId) => {
        set((state) => {
          state.expandedGroups[groupId] = !state.expandedGroups[groupId];
        });
      },

      clearJourneysError: () => {
        set((state) => {
          state.journeysError = null;
        });
      },

      clearCurrentJourneyError: () => {
        set((state) => {
          state.currentJourneyError = null;
        });
      },
    })),
    { name: "journey-store" },
  ),
);

// Selector 함수들 - 불필요한 리렌더링 방지
export const useJourneyBlocks = () =>
  useJourneyStore((state) => state.journeyBlocks);
export const useJourneysLoading = () =>
  useJourneyStore((state) => state.isLoadingJourneys);
export const useJourneysError = () =>
  useJourneyStore((state) => state.journeysError);

export const useCurrentJourneyBlock = () =>
  useJourneyStore((state) => state.currentJourneyBlock);
export const useCurrentJourneyLoading = () =>
  useJourneyStore((state) => state.isLoadingCurrentJourney);
export const useCurrentJourneyError = () =>
  useJourneyStore((state) => state.currentJourneyError);
export const useFlattenedSteps = () =>
  useJourneyStore((state) => state.flattenedSteps);
export const useAllBlocks = () => useJourneyStore((state) => state.allBlocks);
export const useCurrentStepIndex = () =>
  useJourneyStore((state) => state.currentStepIndex);
export const useExpandedGroups = () =>
  useJourneyStore((state) => state.expandedGroups);

// 현재 스텝 selector (계산된 값)
export const useCurrentStep = () => {
  const flattenedSteps = useJourneyStore((state) => state.flattenedSteps);
  const currentStepIndex = useJourneyStore((state) => state.currentStepIndex);
  return flattenedSteps.length > 0 ? flattenedSteps[currentStepIndex] : null;
};
