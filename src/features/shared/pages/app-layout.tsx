import { MobileBottomNav } from "@/features/ui/navigation/mobile-bottom-nav";
import { MobileTopNav } from "@/features/ui/navigation/mobile-top-nav";
import { Sidebar } from "@/features/ui/navigation/sidebar";
import { SidebarProvider } from "@/features/ui/navigation/sidebar-provider";
import { ThemeProvider } from "@/features/ui/ThemeProvider";
import { UserSettingsSync } from "@/features/users/components/user-settings-sync";
import { Outlet } from "@tanstack/react-router";

export const MAIN_CONTENT_ID = "main-content";

export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <ThemeProvider>
        <UserSettingsSync />
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
