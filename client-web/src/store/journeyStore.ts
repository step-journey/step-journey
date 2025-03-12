import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { Block as BlockNoteBlock } from "@blocknote/core";
import {
  getJourney,
  createJourney,
  updateJourney,
  deleteJourney,
  getAllJourneys,
} from "@/services/journeyService";
import { getJourneyById, flattenJourneySteps } from "@/data";
import { Journey, FlattenedStep, GroupData } from "@/types/journey";
import { convertBlockNoteToJourney } from "@/utils/blockNoteConverter";

interface JourneyState {
  // 저니 목록 관련 상태
  journeys: Journey[];
  isLoadingJourneys: boolean;

  // 현재 활성화된 저니 관련 상태
  currentJourney: Journey | null;
  isLoadingCurrentJourney: boolean;
  flattenedSteps: FlattenedStep[];
  currentStepIndex: number;
  expandedGroups: Record<string, boolean>;

  // 편집 상태
  title: string;
  description: string;
  blocks: BlockNoteBlock[];
  isSaving: boolean;
  lastSavedTime: Date | null;
  saveStatus: "idle" | "saving" | "saved" | "failed";

  // 액션
  loadJourneys: () => Promise<void>;
  loadJourney: (id: string, mode: "view" | "edit") => Promise<void>;
  setCurrentStepIndex: (index: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  toggleGroup: (groupId: string) => void;
  setTitle: (title: string) => void;
  setDescription: (description: string) => void;
  setBlocks: (blocks: BlockNoteBlock[]) => void;
  saveJourney: () => Promise<void>;
  createNewJourney: () => Promise<string>;
  deleteCurrentJourney: () => Promise<void>;
}

export const useJourneyStore = create<JourneyState>()(
  immer((set, get) => ({
    // 저니 목록 관련 상태
    journeys: [],
    isLoadingJourneys: false,

    // 현재 활성화된 저니 관련 상태
    currentJourney: null,
    isLoadingCurrentJourney: false,
    flattenedSteps: [],
    currentStepIndex: 0,
    expandedGroups: {},

    // 편집 상태
    title: "",
    description: "",
    blocks: [],
    isSaving: false,
    lastSavedTime: null,
    saveStatus: "idle",

    // 액션 구현
    loadJourneys: async () => {
      set((state) => {
        state.isLoadingJourneys = true;
      });

      try {
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

    loadJourney: async (id, mode) => {
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
          state.title = journey.title;
          state.description = journey.description || "";
          state.flattenedSteps = steps;
          state.currentStepIndex = 0;
          state.expandedGroups = expandedGroups;
          state.isLoadingCurrentJourney = false;
          state.blocks = []; // 편집 모드인 경우 나중에 설정
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

    setTitle: (title) => {
      set((state) => {
        state.title = title;
        state.saveStatus = "idle";
      });
    },

    setDescription: (description) => {
      set((state) => {
        state.description = description;
        state.saveStatus = "idle";
      });
    },

    setBlocks: (blocks) => {
      set((state) => {
        state.blocks = blocks;
        state.saveStatus = "idle";
      });
    },

    saveJourney: async () => {
      const { currentJourney, title, description, blocks, isSaving } = get();

      // 이미 저장 중이거나 제목이 비어있으면 저장하지 않음
      if (isSaving || !title.trim() || !currentJourney) {
        return;
      }

      set((state) => {
        state.isSaving = true;
        state.saveStatus = "saving";
      });

      try {
        // 에디터 내용을 Journey 구조로 변환
        const { groups } = convertBlockNoteToJourney(blocks, currentJourney);

        // Journey 업데이트
        await updateJourney(currentJourney.id, {
          title,
          description,
          groups: groups.length > 0 ? groups : currentJourney.groups,
          updated_at: new Date().toISOString(),
        });

        set((state) => {
          state.isSaving = false;
          state.saveStatus = "saved";
          state.lastSavedTime = new Date();

          // 현재 Journey 객체 업데이트
          if (state.currentJourney) {
            state.currentJourney.title = title;
            state.currentJourney.description = description;
            state.currentJourney.groups =
              groups.length > 0 ? groups : state.currentJourney.groups;
            state.currentJourney.updated_at = new Date().toISOString();

            // 평탄화된 단계 다시 계산
            state.flattenedSteps = flattenJourneySteps(state.currentJourney);
          }
        });

        // 3초 후 상태 초기화
        setTimeout(() => {
          set((state) => {
            if (state.saveStatus === "saved") {
              state.saveStatus = "idle";
            }
          });
        }, 3000);
      } catch (error) {
        console.error("Failed to save journey:", error);
        toast.error("Journey 저장 중 오류가 발생했습니다.");
        set((state) => {
          state.isSaving = false;
          state.saveStatus = "failed";
        });
      }
    },

    createNewJourney: async () => {
      const { title, description, blocks } = get();

      set((state) => {
        state.isSaving = true;
        state.saveStatus = "saving";
      });

      try {
        // 기본 Journey 데이터
        const newJourneyId = uuidv4();
        const defaultJourney: Partial<Journey> = {
          id: newJourneyId,
          title: title || "Untitled Journey",
          description: description || "",
          step_order: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // 블록이 있으면 변환
        if (blocks.length > 0) {
          const { groups } = convertBlockNoteToJourney(blocks);
          defaultJourney.groups = groups;
        } else {
          // 기본 그룹 생성
          defaultJourney.groups = [
            {
              groupId: `group-${uuidv4()}`,
              groupLabel: "기본 그룹",
              mapDescription: "첫 번째 그룹입니다.",
              steps: [
                {
                  id: "1",
                  label: "기본 단계",
                  desc: "이 단계는 기본적으로 생성되었습니다.",
                  content: ["여기에 내용을 추가하세요."],
                },
              ],
            },
          ];
        }

        // DB에 Journey 생성
        await createJourney(defaultJourney);

        set((state) => {
          state.isSaving = false;
          state.saveStatus = "saved";
          state.lastSavedTime = new Date();
        });

        // Journey 목록 다시 로드
        await get().loadJourneys();

        return newJourneyId;
      } catch (error) {
        console.error("Failed to create journey:", error);
        toast.error("Journey 생성 중 오류가 발생했습니다.");
        set((state) => {
          state.isSaving = false;
          state.saveStatus = "failed";
        });
        throw error;
      }
    },

    deleteCurrentJourney: async () => {
      const { currentJourney } = get();

      if (!currentJourney) {
        toast.error("삭제할 Journey가 없습니다.");
        return;
      }

      try {
        await deleteJourney(currentJourney.id);
        toast.success("Journey가 삭제되었습니다.");

        // Journey 목록 다시 로드
        await get().loadJourneys();

        set((state) => {
          state.currentJourney = null;
          state.flattenedSteps = [];
          state.currentStepIndex = 0;
          state.expandedGroups = {};
          state.title = "";
          state.description = "";
          state.blocks = [];
        });
      } catch (error) {
        console.error("Failed to delete journey:", error);
        toast.error("Journey 삭제 중 오류가 발생했습니다.");
      }
    },
  })),
);
