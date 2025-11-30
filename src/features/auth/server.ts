/**
 * Server-Side Auth Helpers
 * 
 * Utilities for server-side authentication checks and session management.
 * Used in route loaders, API handlers, and server components.
 */

import { auth } from "@/lib/auth";
import type { Request } from "@tanstack/react-start";

/**
 * Get the current session from a request
 * @param request - The incoming request object
 * @returns Session object or null if not authenticated
 */
export async function getSession(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    return session;
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
}

/**
 * Assert that a user is authenticated
 * @param request - The incoming request object
 * @throws Error if user is not authenticated
 * @returns Session object
 */
export async function requireAuth(request: Request) {
  const session = await getSession(request);
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

/**
 * Get the current authenticated user from a request
 * @param request - The incoming request object
 * @returns User object or null if not authenticated
 */
export async function getCurrentUser(request: Request) {
  const session = await getSession(request);
  return session?.user || null;
}

/**
 * Get the current authenticated user ID from a request
 * @param request - The incoming request object
 * @returns User ID or null if not authenticated
 */
export async function getUserId(request: Request): Promise<string | null> {
  const user = await getCurrentUser(request);
  return user?.id || null;
}


