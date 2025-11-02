import { apiGet } from "@/features/shared/api/client";
import type { UserResponse } from "@/features/shared/validation/schemas";

/**
 * User API Client
 * Client-side functions for interacting with user endpoints
 */

export async function getMe(): Promise<UserResponse> {
  return apiGet<UserResponse>("/me");
}
