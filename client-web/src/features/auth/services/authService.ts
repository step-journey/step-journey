import { api } from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";
import { User } from "@/features/auth/types/auth";

/**
 * 현재 로그인한 유저의 정보 조회
 */
export const getCurrentUser = async (): Promise<User> => {
  return api.getData<User>(API_ENDPOINTS.users.me);
};
