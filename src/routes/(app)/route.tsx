import { PermissionHelpers } from "@/features/auth/permission.helpers";
import { MobileBottomNav } from "@/features/ui/navigation/mobile-bottom-nav";
import { MobileTopNav } from "@/features/ui/navigation/mobile-top-nav";
import { Sidebar } from "@/features/ui/navigation/sidebar";
import { SidebarProvider } from "@/features/ui/navigation/useSidebar";
import { ThemeProvider } from "@/features/ui/ThemeProvider";
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
          // Use the current location to power a redirect after login
          redirect: location.href,
        },
      });
    }
  },
  component: AppLayout,
});

function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <ThemeProvider>
        <SidebarProvider>
          <MobileTopNav />
          <Sidebar />
          <main className="flex-1 overflow-y-auto bg-background p-4 md:pt-4 md:pb-4">
            <Outlet />
          </main>
          <MobileBottomNav />
        </SidebarProvider>
      </ThemeProvider>
    </div>
  );
}
