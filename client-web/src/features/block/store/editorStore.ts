import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { devtools } from "zustand/middleware";

interface EditorState {
  isEditMode: boolean;
  currentEditingBlock: string | null;
  unsavedChanges: Record<string, boolean>;
}

interface EditorActions {
  toggleEditMode: () => void;
  setCurrentEditingBlock: (blockId: string | null) => void;
  markUnsavedChanges: (blockId: string, hasChanges: boolean) => void;
  hasUnsavedChanges: () => boolean;
}

export const useEditorStore = create<EditorState & EditorActions>()(
  devtools(
    immer((set, get) => ({
      // 상태
      isEditMode: false,
      currentEditingBlock: null,
      unsavedChanges: {},

      // 액션
      toggleEditMode: () =>
        set((state) => {
          state.isEditMode = !state.isEditMode;
          if (!state.isEditMode) {
            state.currentEditingBlock = null;
          }
        }),

      setCurrentEditingBlock: (blockId) =>
        set((state) => {
          state.currentEditingBlock = blockId;
        }),

      markUnsavedChanges: (blockId, hasChanges) =>
        set((state) => {
          state.unsavedChanges[blockId] = hasChanges;
        }),

      hasUnsavedChanges: () => {
        const state = get();
        return Object.values(state.unsavedChanges).some((value) => value);
      },
    })),
    { name: "editor-store" },
  ),
);

// 선택자 함수
export const useIsEditMode = () => useEditorStore((state) => state.isEditMode);
export const useCurrentEditingBlock = () =>
  useEditorStore((state) => state.currentEditingBlock);
export const useToggleEditMode = () =>
  useEditorStore((state) => state.toggleEditMode);
