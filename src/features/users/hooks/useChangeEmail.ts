import { useFinMutation } from "@/features/shared/query/core";
import { queryKeys } from "@/features/shared/query/keys";
import { authClient } from "@/lib/auth-client";

interface IChangeEmailInput {
  newEmail: string;
}

/**
 * Mutation hook for changing user email via Better Auth
 * Note: Email will be updated after user verifies the new address
 */
export function useChangeEmail() {
  return useFinMutation<{ success: boolean }, Error, IChangeEmailInput>({
    mutationFn: async ({ newEmail }) => {
      const result = await authClient.changeEmail({
        newEmail,
        callbackURL: "/account",
      });

      if (result.error) {
        throw new Error(result.error.message || "Failed to change email");
      }

      return { success: true };
    },
    invalidateQueries: [queryKeys.myProfile],
  });
}

