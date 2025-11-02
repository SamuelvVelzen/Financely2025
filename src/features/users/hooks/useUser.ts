import { useFinQuery } from "@/features/shared/query/core";
import { queryKeys } from "@/features/shared/query/keys";
import type { UserResponse } from "@/features/shared/validation/schemas";
import { getMe } from "@/features/users/api/client";

/**
 * Query current user
 * - staleTime: 5 minutes (long, user doesn't change often)
 * - refetchOnWindowFocus: true
 */
export function useMe() {
  return useFinQuery<UserResponse, Error>({
    queryKey: queryKeys.me(),
    queryFn: getMe,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
