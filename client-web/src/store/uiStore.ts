import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface UIState {
  isLoginModalOpen: boolean;
  isDeleteModalOpen: boolean;
  journeyToDelete: string | null;
  globalLoading: boolean;

  // 액션
  openLoginModal: () => void;
  closeLoginModal: () => void;
  openDeleteModal: (journeyId: string) => void;
  closeDeleteModal: () => void;
  setGlobalLoading: (isLoading: boolean) => void;
}

export const useUIStore = create<UIState>()(
  immer((set) => ({
    isLoginModalOpen: false,
    isDeleteModalOpen: false,
    journeyToDelete: null,
    globalLoading: false,

    openLoginModal: () =>
      set((state) => {
        state.isLoginModalOpen = true;
      }),

    closeLoginModal: () =>
      set((state) => {
        state.isLoginModalOpen = false;
      }),

    openDeleteModal: (journeyId) =>
      set((state) => {
        state.isDeleteModalOpen = true;
        state.journeyToDelete = journeyId;
      }),

    closeDeleteModal: () =>
      set((state) => {
        state.isDeleteModalOpen = false;
        state.journeyToDelete = null;
      }),

    setGlobalLoading: (isLoading) =>
      set((state) => {
        state.globalLoading = isLoading;
      }),
  })),
);
