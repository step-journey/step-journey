import { create } from "zustand";
import { api } from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";
import queryClient from "@/lib/queryClient";
import { queryKeys } from "@/api/queryKeys";
import { User } from "@/features/auth/types/auth";

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;

  // 액션
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  logout: () => Promise<void>;
  invalidateUserQueries: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoggedIn: false,
  isLoading: true,

  setUser: (user) =>
    set({
      user,
      isLoggedIn: !!user,
      isLoading: false,
    }),

  setLoading: (isLoading) => set({ isLoading }),

  invalidateUserQueries: async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.users.me() });
  },

  logout: async () => {
    try {
      set({ isLoading: true });
      await api.post(API_ENDPOINTS.auth.logout);

      await useAuthStore.getState().invalidateUserQueries();

      set({ user: null, isLoggedIn: false, isLoading: false });
    } catch (error) {
      console.error("로그아웃 실패:", error);
      set({ isLoading: false });
    }
  },
}));
