import { useFinMutation } from "@/features/shared/query/core";
import { queryKeys } from "@/features/shared/query/keys";
import { authClient } from "@/lib/auth-client";

interface IChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

/**
 * Mutation hook for changing user password via Better Auth
 */
export function useChangePassword() {
  return useFinMutation<{ success: boolean }, Error, IChangePasswordInput>({
    mutationFn: async ({ currentPassword, newPassword }) => {
      const result = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: false,
      });

      if (result.error) {
        throw new Error(result.error.message || "Failed to change password");
      }

      return { success: true };
    },
    invalidateQueries: [queryKeys.myAccounts],
  });
}

