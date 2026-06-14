import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  apiPut,
} from "@/features/shared/api/client";
import type {
  IConnectedAccountsResponse,
  IUpdateUserSettingInput,
  IUpdateWorkspaceSettingInput,
  IUserProfile,
  IUserResponse,
  IUserSetting,
  IWorkspaceSetting,
  IWorkspaceSummary,
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

export async function getMySettings(): Promise<IUserSetting | null> {
  return apiGet<IUserSetting | null>("/me/settings");
}

export async function updateMySettings(
  data: IUpdateUserSettingInput,
): Promise<IUserSetting> {
  return apiPut<IUserSetting>("/me/settings", data);
}

export async function getWorkspaceSettings(
  workspaceId: number,
): Promise<IWorkspaceSetting | null> {
  return apiGet<IWorkspaceSetting | null>(
    `/me/workspaces/${workspaceId}/settings`,
  );
}

export async function updateWorkspaceSettings(
  workspaceId: number,
  data: IUpdateWorkspaceSettingInput,
): Promise<IWorkspaceSetting> {
  return apiPatch<IWorkspaceSetting>(
    `/me/workspaces/${workspaceId}/settings`,
    data,
  );
}

export async function createWorkspace(
  name: string,
): Promise<IWorkspaceSummary> {
  return apiPost<IWorkspaceSummary>("/me/workspaces", { name });
}
