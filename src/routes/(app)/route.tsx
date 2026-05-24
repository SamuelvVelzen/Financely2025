import { getAuthRedirectPath } from "@/features/auth/sanitize-auth-redirect";
import { PermissionHelpers } from "@/features/auth/permission.helpers";
import { MobileBottomNav } from "@/features/ui/navigation/mobile-bottom-nav";
import { MobileTopNav } from "@/features/ui/navigation/mobile-top-nav";
import { Sidebar } from "@/features/ui/navigation/sidebar";
import { SidebarProvider } from "@/features/ui/navigation/useSidebar";
import { ThemeProvider } from "@/features/ui/ThemeProvider";
import { checkOnboardingComplete } from "@/features/transaction/components/wizard/onboarding/onboarding.server";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

// Pathless route group - wraps all routes without adding to URL
export const Route = createFileRoute("/(app)")({
  beforeLoad: async ({ location }) => {
    // Check if user has access using PermissionHelpers with BetterAuth
    const canAccess = await PermissionHelpers.canAccess();

    if (!canAccess) {
      throw redirect({
        to: "/login",
        search: {
          redirect: getAuthRedirectPath(location),
        },
      });
    }

    // Check if onboarding is completed (skip if already on /onboarding)
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

const MAIN_CONTENT_ID = "main-content";

function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <ThemeProvider>
        <SidebarProvider>
          <a
            href={`#${MAIN_CONTENT_ID}`}
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-2xl focus:bg-primary focus:px-4 focus:py-2 focus:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
            Skip to main content
          </a>
          <MobileTopNav />
          <Sidebar />
          <main
            id={MAIN_CONTENT_ID}
            aria-label="Main content"
            tabIndex={-1}
            className="flex-1 overflow-y-auto overflow-x-hidden bg-background p-4 pt-20 pb-24 md:pt-4 md:pb-4 focus:outline-none">
            <Outlet />
          </main>
          <MobileBottomNav />
        </SidebarProvider>
      </ThemeProvider>
    </div>
  );
}
