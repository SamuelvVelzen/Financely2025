import { createFileRoute } from "@tanstack/react-router";
import { ResetPasswordPage } from "@/features/auth/pages/reset-password-page";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      token: (search.token as string) || null,
      email: (search.email as string) || null,
    };
  },
});
