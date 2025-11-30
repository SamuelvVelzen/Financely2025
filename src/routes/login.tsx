import { LoginForm } from "@/features/auth/components/login-form";
import { Container } from "@/features/ui/container/container";
import { Title } from "@/features/ui/typography/title";
import { authClient } from "@/lib/auth-client";
import { createFileRoute, useSearch } from "@tanstack/react-router";
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
      <Container className="w-full sm:w-2/5">
        <div className="text-center">
          <Title>Sign In</Title>
          <p className="text-text-muted mt-2">
            Sign in to your account to continue.
          </p>
        </div>

        <LoginForm />
      </Container>
    </div>
  );
}
