import { getAuthRedirectPath } from "@/features/auth/sanitize-auth-redirect";
import { PermissionHelpers } from "@/features/auth/permission.helpers";
import { checkOnboardingComplete } from "@/features/transaction/components/wizard/onboarding/onboarding.server";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppLayout } from "./app-layout";

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

    if (!location.pathname.startsWith("/onboarding")) {
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
