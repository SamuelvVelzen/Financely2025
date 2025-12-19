import { useFinMutation, useFinQuery } from "@/features/shared/query/core";
import { queryKeys } from "@/features/shared/query/keys";
import type { IConnectedAccountsResponse } from "@/features/shared/validation/schemas";
import { getMyAccounts, unlinkAccount } from "@/features/users/api/client";
import { authClient } from "@/lib/auth-client";

/**
 * Query current user's connected accounts
 */
export function useConnectedAccounts() {
  return useFinQuery<IConnectedAccountsResponse, Error>({
    queryKey: queryKeys.myAccounts(),
    queryFn: getMyAccounts,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Mutation hook to unlink a connected account
 */
export function useUnlinkAccount() {
  return useFinMutation<{ success: boolean }, Error, string>({
    mutationFn: unlinkAccount,
    invalidateQueries: [queryKeys.myAccounts],
  });
}

/**
 * Mutation hook to link a social account
 */
export function useLinkSocialAccount() {
  return useFinMutation<void, Error, { provider: "google" | "microsoft" | "apple" }>({
    mutationFn: async ({ provider }) => {
      const result = await authClient.linkSocial({
        provider,
        callbackURL: "/account",
      });

      if (result.error) {
        throw new Error(result.error.message || `Failed to link ${provider}`);
      }
    },
    invalidateQueries: [queryKeys.myAccounts],
  });
}

