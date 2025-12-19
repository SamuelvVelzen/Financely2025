import { useFinMutation } from "@/features/shared/query/core";
import { queryKeys } from "@/features/shared/query/keys";
import type { IUpdateUserProfileInput } from "@/features/shared/validation/schemas";
import { formatFullName } from "@/features/shared/validation/schemas";
import { authClient } from "@/lib/auth-client";

/**
 * Update user profile via Better Auth
 */
async function updateProfile(
  data: IUpdateUserProfileInput
): Promise<{ success: boolean }> {
  // Compute full name from parts
  const name = formatFullName(data.firstName, data.lastName, data.suffix);

  const result = await authClient.updateUser({
    name: name || undefined,
    firstName: data.firstName,
    lastName: data.lastName,
    suffix: data.suffix || undefined,
  });

  if (result.error) {
    throw new Error(result.error.message || "Failed to update profile");
  }

  return { success: true };
}

/**
 * Mutation hook for updating user profile
 * Invalidates both me and myProfile queries on success
 */
export function useUpdateProfile() {
  return useFinMutation<{ success: boolean }, Error, IUpdateUserProfileInput>({
    mutationFn: updateProfile,
    invalidateQueries: [queryKeys.me, queryKeys.myProfile],
  });
}

