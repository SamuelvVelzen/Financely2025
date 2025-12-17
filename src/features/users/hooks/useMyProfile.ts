import { useFinQuery } from "@/features/shared/query/core";
import { queryKeys } from "@/features/shared/query/keys";
import type { IUserProfile } from "@/features/shared/validation/schemas";
import { getMyProfile } from "@/features/users/api/client";

/**
 * Query current user's profile (UserInfo data)
 * - staleTime: 5 minutes (long, profile doesn't change often)
 * - refetchOnWindowFocus: true
 */
export function useMyProfile() {
  return useFinQuery<IUserProfile, Error>({
    queryKey: queryKeys.myProfile(),
    queryFn: getMyProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
