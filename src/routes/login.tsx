import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { PermissionHelpers } from "@/features/auth/permission.helpers";
import { useEffect } from "react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      redirect: (search.redirect as string) || "/",
    };
  },
});

function LoginPage() {
  const { redirect } = useSearch({ from: "/login" });
  const navigate = useNavigate();

  // If already authenticated, redirect to the intended destination
  useEffect(() => {
    if (PermissionHelpers.canAccess()) {
      navigate({ to: redirect });
    }
  }, [redirect, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Login</h1>
          <p className="text-text-muted mt-2">
            Please log in to access this application.
          </p>
        </div>
        <div className="p-4 bg-surface-hover rounded-lg border border-border">
          <p className="text-sm text-text-muted">
            Authentication is currently in development. This is a placeholder
            login page.
          </p>
        </div>
      </div>
    </div>
  );
}
