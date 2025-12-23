/**
 * Password Reset Page
 *
 * Handles both requesting a password reset and confirming/resetting the password
 * with a token from the email link.
 */

import { ROUTES } from "@/config/routes";
import { Button } from "@/features/ui/button/button";
import { LinkButton } from "@/features/ui/button/link-button";
import { Container } from "@/features/ui/container/container";
import { Form } from "@/features/ui/form/form";
import { BaseInput } from "@/features/ui/input/input";
import { Title } from "@/features/ui/typography/title";
import { authClient } from "@/lib/auth-client";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createFileRoute,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Validation schemas
const requestResetSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RequestResetFormData = z.infer<typeof requestResetSchema>;
type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      token: (search.token as string) || null,
      email: (search.email as string) || null,
    };
  },
});

function ResetPasswordPage() {
  const { token, email: searchEmail } = useSearch({ from: "/reset-password" });
  const navigate = useNavigate();
  const [mode, setMode] = useState<"request" | "reset">(
    token ? "reset" : "request"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const requestForm = useForm<RequestResetFormData>({
    resolver: zodResolver(requestResetSchema),
    defaultValues: {
      email: searchEmail || "",
    },
  });

  const resetForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // If token is provided, switch to reset mode
  useEffect(() => {
    if (token) {
      setMode("reset");
    }
  }, [token]);

  // Update email when searchEmail changes
  useEffect(() => {
    if (searchEmail) {
      requestForm.setValue("email", searchEmail);
    }
  }, [searchEmail, requestForm]);

  const handleRequestReset = async (data: RequestResetFormData) => {
    setError(null);
    setLoading(true);

    try {
      const result = await authClient.requestPasswordReset({
        email: data.email,
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (result.error) {
        setError(result.error.message || "An error occurred");
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (data: ResetPasswordFormData) => {
    if (!token) {
      setError("Invalid or missing reset token");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const result = await authClient.resetPassword({
        newPassword: data.password,
        token: token,
      });

      if (result.error) {
        setError(result.error.message || "An error occurred");
        return;
      }

      setSuccess(true);
      // Redirect to login after a delay
      setTimeout(() => {
        navigate({ to: ROUTES.LOGIN, search: { redirect: "" } });
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (success && mode === "request") {
    const email = requestForm.getValues("email");
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Container className="w-full sm:w-2/5 xl:w-1/4 mx-8 sm:mx-0">
          <div className="text-center">
            <Title>Check your email</Title>
            <p className="text-text-muted mt-2">
              We've sent a password reset link to {email}
            </p>
          </div>
        </Container>
      </div>
    );
  }

  if (success && mode === "reset") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Container className="w-full sm:w-2/5 xl:w-1/4 mx-8 sm:mx-0">
          <div className="text-center">
            <Title>Password reset successful</Title>
            <p className="text-text-muted mt-2">
              Your password has been reset. Redirecting to login...
            </p>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Container className="w-full sm:w-2/5 xl:w-1/4 mx-8 sm:mx-0">
        <div className="text-center">
          <Title>
            {mode === "request" ? "Reset Password" : "Set New Password"}
          </Title>
          <p className="text-text-muted mt-2">
            {mode === "request"
              ? "Enter your email to receive a password reset link"
              : "Enter your new password"}
          </p>
        </div>

        {error && (
          <div className="p-4 bg-danger/10 border border-danger rounded-lg">
            <p className="text-danger text-sm">{error}</p>
          </div>
        )}

        {mode === "request" ? (
          <Form
            form={requestForm}
            onSubmit={handleRequestReset}
            className="space-y-4">
            <BaseInput
              name="email"
              type="email"
              label="Email"
              placeholder="you@example.com"
              disabled={loading}
            />

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-full">
              {loading ? "Processing..." : "Send Reset Link"}
            </Button>
          </Form>
        ) : (
          <Form
            form={resetForm}
            onSubmit={handleResetPassword}
            className="space-y-4">
            <BaseInput
              name="password"
              type="password"
              label="New Password"
              placeholder="••••••••"
              disabled={loading}
            />

            <BaseInput
              name="confirmPassword"
              type="password"
              label="Confirm Password"
              placeholder="••••••••"
              disabled={loading}
            />

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-full">
              {loading ? "Processing..." : "Reset Password"}
            </Button>
          </Form>
        )}

        <LinkButton
          clicked={() =>
            navigate({ to: ROUTES.LOGIN, search: { redirect: "" } })
          }
          variant="primary"
          className="mx-auto mt-4">
          Back to login
        </LinkButton>
      </Container>
    </div>
  );
}
