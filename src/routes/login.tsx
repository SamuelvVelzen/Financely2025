import { sanitizeAuthRedirect } from "@/features/auth/sanitize-auth-redirect";
import { createFileRoute } from "@tanstack/react-router";
import { LoginPage } from "@/features/auth/pages/login-page";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      redirect: sanitizeAuthRedirect(search.redirect as string | undefined),
    };
  },
});
