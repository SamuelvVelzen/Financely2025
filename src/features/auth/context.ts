import { getUserId as getUserIdFromRequest, requireAuth as requireAuthFromRequest } from "./server";
import type { Request } from "@tanstack/react-start";
import { PermissionHelpers } from "./permission.helpers";

/**
 * Auth context utility
 *
 * Server-side authentication utilities using BetterAuth.
 * For client-side auth state, use the authClient from @/lib/auth-client.
 */

/**
 * Get the current authenticated user ID from a request
 * @param request - The incoming request object (required for server-side)
 * @returns userId or null if unauthenticated
 */
export async function getUserId(request?: Request): Promise<string | null> {
  if (!request) {
    // Client-side: This should not be called without a request
    // For client-side, use authClient.useSession() hook instead
    console.warn("getUserId called without request. Use authClient.useSession() for client-side.");
    return null;
  }
  return getUserIdFromRequest(request);
}

/**
 * Assert that a user is authenticated
 * @param request - The incoming request object (required for server-side)
 * @throws Error if user is not authenticated
 * @returns userId
 */
export async function requireAuth(request?: Request): Promise<string> {
  if (!request) {
    throw new Error("requireAuth requires a request object");
  }
  const session = await requireAuthFromRequest(request);
  return session.user.id;
}

/**
 * Auth middleware for API routes
 * Extracts and validates authentication, then provides userId to handlers
 * 
 * @param handler - Function that receives userId and returns a response
 * @param request - The incoming request object (optional, but required for BetterAuth)
 * @returns Promise that resolves to the handler's return value
 */
export async function withAuth<T>(
  handler: (userId: string) => Promise<T> | T,
  request?: Request
): Promise<T> {
  if (!request) {
    throw new Error("withAuth requires a request object for BetterAuth integration");
  }
  const userId = await requireAuth(request);
  return Promise.resolve(handler(userId));
}
