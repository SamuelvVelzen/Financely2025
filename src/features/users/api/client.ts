import { apiGet } from "@/features/shared/api/client";
import type {
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
