import apiClient from "@/services/apiClient";
import { API_ENDPOINTS } from "@/constants/apiEndpoints";
import { User } from "@/features/auth/types/auth";

// 사용자 정보 조회
export async function fetchUser(): Promise<User | null> {
  try {
    const response = await apiClient.get(API_ENDPOINTS.users.me);
    return {
      name: response.data.name,
      email: response.data.email,
    };
  } catch {
    return null;
  }
}

// 로그아웃 요청
export async function logoutUser(): Promise<void> {
  await apiClient.post(API_ENDPOINTS.auth.logout);
}
