import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import apiClient from "@/services/apiClient";
import { API_ENDPOINTS } from "@/constants/apiEndpoints";

export interface User {
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;

  // 액션
  fetchUser: () => Promise<User | null>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  immer((set, get) => ({
    user: null,
    isLoading: false,
    error: null,

    fetchUser: async () => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const response = await apiClient.get(API_ENDPOINTS.users.me);
        const user = {
          name: response.data.name,
          email: response.data.email,
        };

        set((state) => {
          state.user = user;
          state.isLoading = false;
        });

        return user;
      } catch (error) {
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
        await apiClient.post(API_ENDPOINTS.auth.logout);
        set((state) => {
          state.user = null;
          state.isLoading = false;
        });
      } catch (error) {
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
  })),
);
