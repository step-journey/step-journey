import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from "@tanstack/react-query";
import apiClient from "@/services/apiClient";
import { API_ENDPOINTS } from "@/constants/apiEndpoints";

/**
 * 서버에서 내려주는 User 스키마에 맞게 타입을 정의 필요
 */
export interface User {
  name: string;
  email: string;
}

/**
 * 1) /users/me 호출로부터 User 정보를 가져오는 비동기 함수
 *    - 실패 시(401 등) null 반환하여 "비로그인 상태"로 처리
 */
async function fetchUser(): Promise<User | null> {
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

/**
 * 2) React Query 의 useQuery 훅
 *    - TQueryFnData = User | null
 *    - TData = User | null
 *    - TError = Error
 *
 *    (v5에서 cacheTime → gcTime, keepUnusedDataFor 지원 X)
 */
export function useUserQuery(): UseQueryResult<User | null, Error> {
  return useQuery<User | null, Error, User | null>({
    queryKey: ["user"],
    queryFn: fetchUser,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

/**
 * 3) /auth/logout 요청을 담당하는 비동기 함수
 */
async function logoutUser(): Promise<void> {
  await apiClient.post(API_ENDPOINTS.auth.logout);
}

/**
 * 4) 로그아웃을 처리하는 useMutation 훅 (v5)
 *    - onSuccess 콜백에서 캐시의 "user"를 null 로 세팅하여 비로그인 상태로 만듦
 */
export function useLogoutMutation(): UseMutationResult<
  void,
  Error,
  void,
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, void, unknown>({
    mutationFn: logoutUser,
    onSuccess: () => {
      queryClient.setQueryData(["user"], null);
    },
  });
}
