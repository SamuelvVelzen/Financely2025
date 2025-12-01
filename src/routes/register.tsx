import { RegisterForm } from "@/features/auth/components/register-form";
import { Container } from "@/features/ui/container/container";
import { Title } from "@/features/ui/typography/title";
import { authClient } from "@/lib/auth-client";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      redirect: (search.redirect as string) || "/",
    };
  },
});

function RegisterPage() {
  const { redirect } = useSearch({ from: "/register" });

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
      <Container className="w-full sm:w-2/5 xl:w-1/4 mx-8 sm:mx-0">
        <div className="text-center">
          <Title>Create Account</Title>
          <p className="text-text-muted mt-2">
            Sign up to get started with your account.
          </p>
        </div>

        <RegisterForm />
      </Container>
    </div>
  );
}
