import { getAuthRedirectPath } from "@/features/auth/sanitize-auth-redirect";
import { PermissionHelpers } from "@/features/auth/permission.helpers";
import { AppLayout } from "@/features/shared/pages/app-layout";
import { checkOnboardingComplete } from "@/features/wizard/wizard.server";
import { isWizardPathExemptFromOnboardingGate } from "@/features/wizard/wizard-ids";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)")({
  beforeLoad: async ({ location }) => {
    const canAccess = await PermissionHelpers.canAccess();

    if (!canAccess) {
      throw redirect({
        to: "/login",
        search: {
          redirect: getAuthRedirectPath(location),
        },
      });
    }

    if (!isWizardPathExemptFromOnboardingGate(location.pathname)) {
      const isOnboardingComplete = await checkOnboardingComplete();
      if (!isOnboardingComplete) {
        throw redirect({
          to: "/onboarding",
        });
      }
    }
  },
  component: AppLayout,
});
