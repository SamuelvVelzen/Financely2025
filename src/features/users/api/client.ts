import { apiDelete, apiGet } from "@/features/shared/api/client";
import type {
  IConnectedAccountsResponse,
  IUserProfile,
  IUserResponse,
} from "@/features/shared/validation/schemas";

/**
 * User API Client
 * Client-side functions for interacting with user endpoints
 */

/**
 * Get current user's app data (User table)
 */
export async function getMe(): Promise<IUserResponse> {
  return apiGet<IUserResponse>("/me");
}

/**
 * Get current user's profile data (UserInfo table)
 */
export async function getMyProfile(): Promise<IUserProfile> {
  return apiGet<IUserProfile>("/me/profile");
}

/**
 * Get current user's connected accounts (OAuth providers)
 */
export async function getMyAccounts(): Promise<IConnectedAccountsResponse> {
  return apiGet<IConnectedAccountsResponse>("/me/accounts");
}

/**
 * Unlink a connected account
 */
export async function unlinkAccount(
  accountId: string
): Promise<{ success: boolean }> {
  return apiDelete<{ success: boolean }>(`/me/accounts/${accountId}`);
}
