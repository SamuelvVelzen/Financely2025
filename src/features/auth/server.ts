/**
 * Server-Side Auth Helpers
 *
 * Utilities for server-side authentication checks and session management.
 * Used in route loaders, API handlers, and server components.
 */

import { UnauthorizedError } from "@/features/auth/errors";
import { auth } from "@/lib/auth";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

/**
 * Get the current session from a request
 * @param request - The incoming request object
 * @returns Session object or null if not authenticated
 */
export const getServerSession = createServerFn({ method: "GET" }).handler(
  async () => {
    try {
      const headers = getRequestHeaders();
      const session = await auth.api.getSession({
        headers,
      });

      return session;
    } catch (error) {
      console.error("Error getting server session", error);
      return null;
    }
  }
);

/**
 * Assert that a user is authenticated
 * @param request - The incoming request object
 * @throws UnauthorizedError if user is not authenticated
 * @returns Session object
 */
export async function requireAuth() {
  const session = await getServerSession();
  if (!session) {
    throw new UnauthorizedError();
  }
  return session;
}
