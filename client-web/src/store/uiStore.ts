import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { devtools } from "zustand/middleware";

// 상태 인터페이스 정의
interface UIState {
  modals: {
    isLoginModalOpen: boolean;
    isDeleteModalOpen: boolean;
    journeyToDelete: string | null;
  };
  loading: {
    globalLoading: boolean;
  };
}

// 액션 인터페이스 정의
interface UIActions {
  // 모달 관련 액션
  openLoginModal: () => void;
  closeLoginModal: () => void;
  openDeleteModal: (journeyId: string) => void;
  closeDeleteModal: () => void;

  // 로딩 상태 관련 액션
  setGlobalLoading: (isLoading: boolean) => void;
}

// 초기 상태 정의
const initialState: UIState = {
  modals: {
    isLoginModalOpen: false,
    isDeleteModalOpen: false,
    journeyToDelete: null,
  },
  loading: {
    globalLoading: false,
  },
};

// Zustand 스토어 생성
export const useUIStore = create<UIState & UIActions>()(
  devtools(
    immer((set) => ({
      ...initialState,

      // 모달 액션
      openLoginModal: () =>
        set((state) => {
          state.modals.isLoginModalOpen = true;
        }),

      closeLoginModal: () =>
        set((state) => {
          state.modals.isLoginModalOpen = false;
        }),

      openDeleteModal: (journeyId) =>
        set((state) => {
          state.modals.isDeleteModalOpen = true;
          state.modals.journeyToDelete = journeyId;
        }),

      closeDeleteModal: () =>
        set((state) => {
          state.modals.isDeleteModalOpen = false;
          state.modals.journeyToDelete = null;
        }),

      // 로딩 상태 액션
      setGlobalLoading: (isLoading) =>
        set((state) => {
          state.loading.globalLoading = isLoading;
        }),
    })),
    { name: "ui-store" },
  ),
);

// Selector 함수들 - 불필요한 리렌더링 방지
export const useLoginModalState = () =>
  useUIStore((state) => state.modals.isLoginModalOpen);
export const useDeleteModalState = () =>
  useUIStore((state) => state.modals.isDeleteModalOpen);
export const useJourneyToDelete = () =>
  useUIStore((state) => state.modals.journeyToDelete);
export const useGlobalLoading = () =>
  useUIStore((state) => state.loading.globalLoading);
