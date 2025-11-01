import { getMe } from "@/lib/api/endpoints";
import type { UserResponse } from "@/lib/validation/schemas";
import { queryKeys } from "../keys";
import { useFinQuery } from "./core";

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
