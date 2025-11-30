import { PermissionHelpers } from "@/features/auth/permission.helpers";
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
          <Sidebar />
          <main className="flex-1 overflow-y-auto bg-background p-8">
            <Outlet />
          </main>
        </SidebarProvider>
      </ThemeProvider>
    </div>
  );
}
