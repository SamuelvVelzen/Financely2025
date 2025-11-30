import { requireAuth as requireAuthFromRequest } from "./server";

/**
 * Assert that a user is authenticated
 * @param request - The incoming request object (required for server-side)
 * @throws Error if user is not authenticated
 * @returns userId
 */
export async function requireAuth(): Promise<string> {
  const session = await requireAuthFromRequest();
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
  handler: (userId: string) => Promise<T> | T
): Promise<T> {
  const userId = await requireAuth();
  return Promise.resolve(handler(userId));
}
