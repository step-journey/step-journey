import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/api/queryKeys.ts";
import { User } from "../types/auth";
import { getCurrentUser } from "../services/authService";

export function useCurrentUser() {
  return useQuery<User, Error>({
    queryKey: queryKeys.users.me(),
    queryFn: getCurrentUser,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });
}
