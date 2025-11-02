/**
 * Auth context utility
 *
 * In a real application, this would:
 * - Extract userId from session/token/cookie
 * - Validate authentication
 * - Return null if unauthenticated
 *
 * For now, this is a placeholder that returns a mock userId.
 * Replace this with real auth middleware when implementing authentication.
 */

/**
 * Get the current authenticated user ID
 * @returns userId or null if unauthenticated
 */
export function getUserId(): string | null {
  // TODO: Replace with real auth
  // For development, using a mock user ID
  // In production, extract from session/cookie/JWT
  return "mock-user-id";
}

/**
 * Assert that a user is authenticated
 * @throws Error if user is not authenticated
 * @returns userId
 */
export function requireAuth(): string {
  const userId = getUserId();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

/**
 * Auth middleware for API routes
 * Extracts and validates authentication, then provides userId to handlers
 */
export function withAuth<T>(
  handler: (userId: string) => Promise<T> | T
): Promise<T> {
  const userId = requireAuth();
  return Promise.resolve(handler(userId));
}
