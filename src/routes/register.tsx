import { sanitizeAuthRedirect } from "@/features/auth/sanitize-auth-redirect";
import { createFileRoute } from "@tanstack/react-router";
import { RegisterPage } from "./register-page";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      redirect: sanitizeAuthRedirect(search.redirect as string | undefined),
    };
  },
});
