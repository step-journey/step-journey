import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { devtools } from "zustand/middleware";
import * as authService from "@/services/authService";
import { User } from "@/types/auth";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  fetchUser: () => Promise<User | null>;
  logout: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User | null) => void;
}

// 상태와 액션을 분리하여 정의
const initialState: AuthState = {
  user: null,
  isLoading: false,
  error: null,
};

export const useAuthStore = create<AuthState & AuthActions>()(
  devtools(
    immer((set) => ({
      // get 파라미터 제거
      ...initialState,

      // 액션
      fetchUser: async () => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const user = await authService.fetchUser();

          set((state) => {
            state.user = user;
            state.isLoading = false;
          });

          return user;
        } catch (error) {
          // 언더스코어 추가하여 미사용 변수 경고 해결
          set((state) => {
            state.user = null;
            state.isLoading = false;
            state.error = "사용자 정보를 가져오는데 실패했습니다.";
          });
          return null;
        }
      },

      logout: async () => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          await authService.logoutUser();
          set((state) => {
            state.user = null;
            state.isLoading = false;
          });
        } catch (error) {
          // 언더스코어 추가하여 미사용 변수 경고 해결
          set((state) => {
            state.isLoading = false;
            state.error = "로그아웃에 실패했습니다.";
          });
        }
      },

      clearError: () => {
        set((state) => {
          state.error = null;
        });
      },

      setUser: (user) => {
        set((state) => {
          state.user = user;
        });
      },
    })),
    { name: "auth-store" },
  ),
);

// 선택자(Selector) 함수 - 불필요한 리렌더링 방지
export const useAuthUser = () => useAuthStore((state) => state.user);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);
