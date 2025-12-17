import { prisma } from "@/util/prisma";
import { requireAuth as requireAuthFromRequest } from "./server";

/**
 * Get the app User ID from the session
 * Since session.user is now UserInfo (the BetterAuth table),
 * we need to look up the associated User record
 */
async function getAppUserId(userInfoId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { userInfoId },
    select: { id: true },
  });

  if (!user) {
    throw new Error("User not found for this account");
  }

  return user.id;
}

/**
 * Assert that a user is authenticated
 * @throws Error if user is not authenticated
 * @returns userId (the app User ID, not the UserInfo ID)
 */
export async function requireAuth(): Promise<string> {
  const session = await requireAuthFromRequest();
  // session.user.id is now the UserInfo ID
  // We need to get the associated app User ID
  return getAppUserId(session.user.id);
}

/**
 * Auth middleware for API routes
 * Extracts and validates authentication, then provides userId to handlers
 *
 * @param handler - Function that receives userId and returns a response
 * @returns Promise that resolves to the handler's return value
 */
export async function withAuth<T>(
  handler: (userId: string) => Promise<T> | T
): Promise<T> {
  const userId = await requireAuth();
  return Promise.resolve(handler(userId));
}
