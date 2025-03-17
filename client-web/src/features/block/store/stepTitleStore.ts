import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { devtools } from "zustand/middleware";

interface StepTitleState {
  editingTitles: Record<string, string>;
  savedTitles: Record<string, string>;
}

interface StepTitleActions {
  saveTitle: (stepId: string, title: string) => void;
  getStepTitle: (stepId: string, defaultTitle?: string) => string;
  resetStore: () => void;
}

const initialState: StepTitleState = {
  editingTitles: {},
  savedTitles: {},
};

export const useStepTitleStore = create<StepTitleState & StepTitleActions>()(
  devtools(
    immer((set, get) => ({
      ...initialState,

      saveTitle: (stepId, title) =>
        set((state) => {
          state.editingTitles[stepId] = title;
          state.savedTitles[stepId] = title;
        }),

      getStepTitle: (stepId, defaultTitle = "") => {
        const state = get();
        return state.editingTitles[stepId] !== undefined
          ? state.editingTitles[stepId]
          : state.savedTitles[stepId] || defaultTitle;
      },

      resetStore: () => {
        return set(() => ({
          editingTitles: {},
          savedTitles: {},
        }));
      },
    })),
    { name: "step-title-store" },
  ),
);

export const useEditingStepTitle = (stepId: string, defaultTitle = "") =>
  useStepTitleStore((state) =>
    state.editingTitles[stepId] !== undefined
      ? state.editingTitles[stepId]
      : state.savedTitles[stepId] || defaultTitle,
  );
