import { createFileRoute, useSearch } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";
import { LoginForm } from "@/features/auth/components/login-form";
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

  // Check if already authenticated and redirect
  useEffect(() => {
    authClient.getSession().then((session) => {
      if (session.data) {
        window.location.href = redirect || "/";
      }
    });
  }, [redirect]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Sign In</h1>
          <p className="text-text-muted mt-2">
            Sign in to your account to continue.
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
