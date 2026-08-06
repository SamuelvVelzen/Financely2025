/**
 * Server-side wizard completion checks for route beforeLoad gates.
 */

import { getServerSession } from "@/features/auth/server";
import { WizardService } from "@/features/wizard/services/wizard.service";
import { WIZARD_IDS } from "@/features/wizard/wizard-ids";
import { prisma } from "@/features/util/prisma";
import { createServerFn } from "@tanstack/react-start";

/**
 * Returns true if the onboarding wizard is complete (or there is no session /
 * app user). Fail-open on errors so auth/registration edge cases are not blocked.
 */
export const checkOnboardingComplete = createServerFn({
  method: "GET",
}).handler(async () => {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      return true;
    }

    const user = await prisma.user.findUnique({
      where: { userInfoId: session.user.id },
      select: { id: true },
    });

    if (!user) {
      return true;
    }

    return WizardService.isWizardCompleted(user.id, WIZARD_IDS.ONBOARDING);
  } catch (error) {
    console.error("Error checking onboarding wizard status:", error);
    return true;
  }
});
