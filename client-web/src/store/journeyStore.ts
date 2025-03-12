import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { toast } from "sonner";
import { getJourney, getAllJourneys } from "@/services/journeyService";
import { getJourneyById, flattenJourneySteps } from "@/data";
import { Journey, FlattenedStep } from "@/types/journey";
import { initializeDatabase } from "@/services/journeyService";

interface JourneyState {
  // Journey 목록 관련 상태
  journeys: Journey[];
  isLoadingJourneys: boolean;

  // 현재 활성화된 Journey 관련 상태
  currentJourney: Journey | null;
  isLoadingCurrentJourney: boolean;
  flattenedSteps: FlattenedStep[];
  currentStepIndex: number;
  expandedGroups: Record<string, boolean>;

  // 액션
  loadJourneys: () => Promise<void>;
  loadJourney: (id: string) => Promise<void>;
  setCurrentStepIndex: (index: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  toggleGroup: (groupId: string) => void;
}

export const useJourneyStore = create<JourneyState>()(
  immer((set, get) => ({
    // Journey 목록 관련 상태
    journeys: [],
    isLoadingJourneys: false,

    // 현재 활성화된 Journey 관련 상태
    currentJourney: null,
    isLoadingCurrentJourney: false,
    flattenedSteps: [],
    currentStepIndex: 0,
    expandedGroups: {},

    // 액션 구현
    loadJourneys: async () => {
      set((state) => {
        state.isLoadingJourneys = true;
      });

      try {
        // DB 초기화
        await initializeDatabase();

        // IndexedDB에서 Journey 목록 로드
        const dbJourneys = await getAllJourneys();

        // 정적 데이터와 병합
        const staticJourneys = await import("@/data").then(
          (module) => module.journeys,
        );
        const combinedJourneys = [...dbJourneys];

        // 정적 데이터 중 DB에 없는 것만 추가
        for (const staticJourney of staticJourneys) {
          if (
            !dbJourneys.some((dbJourney) => dbJourney.id === staticJourney.id)
          ) {
            combinedJourneys.push(staticJourney);
          }
        }

        set((state) => {
          state.journeys = combinedJourneys;
          state.isLoadingJourneys = false;
        });
      } catch (error) {
        console.error("Failed to load journeys:", error);
        toast.error("Journey 목록을 불러오는 중 오류가 발생했습니다.");
        set((state) => {
          state.isLoadingJourneys = false;
        });
      }
    },

    loadJourney: async (id) => {
      set((state) => {
        state.isLoadingCurrentJourney = true;
      });

      try {
        // DB 및 정적 데이터에서 Journey 찾기
        let journey = await getJourney(id);
        if (!journey) {
          journey = getJourneyById(id);
        }

        if (!journey) {
          toast.error("Journey를 찾을 수 없습니다.");
          set((state) => {
            state.isLoadingCurrentJourney = false;
          });
          return;
        }

        // 그룹 데이터 확인
        if (
          !journey.groups ||
          !Array.isArray(journey.groups) ||
          journey.groups.length === 0
        ) {
          journey.groups = [
            {
              groupId: "default-group",
              groupLabel: "기본 그룹",
              mapDescription: "이 그룹은 기본적으로 생성되었습니다.",
              steps: [
                {
                  id: "1",
                  label: "기본 단계",
                  desc: "내용을 추가하려면 편집 버튼을 클릭하세요.",
                  content: ["여기에 내용을 추가하세요."],
                },
              ],
            },
          ];
        }

        // 단계 평탄화
        const steps = flattenJourneySteps(journey);

        // 첫 번째 그룹 펼치기
        const expandedGroups: Record<string, boolean> = {};
        if (steps.length > 0) {
          expandedGroups[steps[0].groupId] = true;
        }

        set((state) => {
          state.currentJourney = journey;
          state.flattenedSteps = steps;
          state.currentStepIndex = 0;
          state.expandedGroups = expandedGroups;
          state.isLoadingCurrentJourney = false;
        });
      } catch (error) {
        console.error("Failed to load journey:", error);
        toast.error("Journey를 불러오는 중 오류가 발생했습니다.");
        set((state) => {
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
  })),
);
