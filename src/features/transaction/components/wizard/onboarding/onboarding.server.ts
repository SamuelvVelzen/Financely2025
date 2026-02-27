/**
 * Server-Side Onboarding Wizard Helpers
 *
 * Server functions for checking onboarding wizard completion status.
 * Used in route beforeLoad for redirecting new users.
 */

import { prisma } from "@/features/util/prisma";
import { createServerFn } from "@tanstack/react-start";
import { getServerSession } from "@/features/auth/server";

const ONBOARDING_WIZARD_ID = "onboarding";

/**
 * Check if the onboarding wizard is completed for the current user.
 * Returns true if completed or if there's no authenticated user.
 * This is used in route beforeLoad to redirect new users to onboarding.
 */
export const checkOnboardingComplete = createServerFn({ method: "GET" }).handler(
  async () => {
    try {
      // Get the current session
      const session = await getServerSession();

      // If no session, let the auth check handle it
      if (!session?.user?.id) {
        return true;
      }

      // Get the app User ID from the UserInfo ID
      const user = await prisma.user.findUnique({
        where: { userInfoId: session.user.id },
        select: { id: true },
      });

      // If no app user found, let them through (edge case during registration)
      if (!user) {
        return true;
      }

      // Check if onboarding wizard is completed
      const wizardProgress = await prisma.wizardProgress.findUnique({
        where: {
          userId_wizardId: {
            userId: user.id,
            wizardId: ONBOARDING_WIZARD_ID,
          },
        },
        select: { completed: true },
      });

      return wizardProgress?.completed ?? false;
    } catch (error) {
      // On error, let them through to avoid blocking access
      console.error("Error checking onboarding status:", error);
      return true;
    }
  }
);
