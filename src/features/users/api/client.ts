import { apiGet } from "@/features/shared/api/client";
import type { IUserResponse } from "@/features/shared/validation/schemas";

/**
 * User API Client
 * Client-side functions for interacting with user endpoints
 */

export async function getMe(): Promise<IUserResponse> {
  return apiGet<IUserResponse>("/me");
}
