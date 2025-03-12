import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { devtools } from "zustand/middleware";
import { toast } from "sonner";
import * as journeyService from "@/features/journey/services/journeyService";
import { Journey, FlattenedStep } from "@/features/journey/types/journey";

// 상태 인터페이스 정의
interface JourneyState {
  // Journey 목록 관련 상태
  journeys: Journey[];
  isLoadingJourneys: boolean;
  journeysError: string | null;

  // 현재 활성화된 Journey 관련 상태
  currentJourney: Journey | null;
  isLoadingCurrentJourney: boolean;
  currentJourneyError: string | null;
  flattenedSteps: FlattenedStep[];
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
  journeys: [],
  isLoadingJourneys: false,
  journeysError: null,

  currentJourney: null,
  isLoadingCurrentJourney: false,
  currentJourneyError: null,
  flattenedSteps: [],
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
          const combinedJourneys = await journeyService.getCombinedJourneys();

          set((state) => {
            state.journeys = combinedJourneys;
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
          const { journey, flattenedSteps } =
            await journeyService.loadJourneyWithSteps(id);

          if (!journey) {
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
            expandedGroups[flattenedSteps[0].groupId] = true;
          }

          set((state) => {
            state.currentJourney = journey;
            state.flattenedSteps = flattenedSteps;
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
            if (currentStep) {
              state.expandedGroups[currentStep.groupId] = true;
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
export const useJourneysList = () => useJourneyStore((state) => state.journeys);
export const useJourneysLoading = () =>
  useJourneyStore((state) => state.isLoadingJourneys);
export const useJourneysError = () =>
  useJourneyStore((state) => state.journeysError);

export const useCurrentJourney = () =>
  useJourneyStore((state) => state.currentJourney);
export const useCurrentJourneyLoading = () =>
  useJourneyStore((state) => state.isLoadingCurrentJourney);
export const useCurrentJourneyError = () =>
  useJourneyStore((state) => state.currentJourneyError);
export const useFlattenedSteps = () =>
  useJourneyStore((state) => state.flattenedSteps);
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
