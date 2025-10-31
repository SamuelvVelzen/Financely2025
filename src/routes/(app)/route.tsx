import Sidebar from "@/components/navigation/sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { createFileRoute, Outlet } from "@tanstack/react-router";

// Pathless route group - wraps all routes without adding to URL
export const Route = createFileRoute("/(app)")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <ThemeProvider>
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-background p-8">
          <Outlet />
        </main>
      </ThemeProvider>
    </div>
  );
}
