import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchUser, logoutUser } from "@/services/authService";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { toast } from "sonner";

// 사용자 정보를 조회하는 훅
export function useUser() {
  return useQuery({
    queryKey: QUERY_KEYS.user.me,
    queryFn: fetchUser,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5분
  });
}

// 로그아웃을 처리하는 훅
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      // 성공 시 사용자 정보 캐시 무효화
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.user.me });
      queryClient.setQueryData(QUERY_KEYS.user.me, null);
      toast.success("로그아웃되었습니다.");
    },
  });
}
