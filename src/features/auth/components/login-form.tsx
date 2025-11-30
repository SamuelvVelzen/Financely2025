/**
 * Login Form Component
 *
 * Authentication form supporting:
 * - Email/password login
 * - Magic link
 * - Social OAuth providers (Google, Microsoft, Apple)
 */

import { Button } from "@/features/ui/button/button";
import { Form } from "@/features/ui/form/form";
import { BaseInput } from "@/features/ui/input/input";
import { authClient } from "@/lib/auth-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Feature flags from environment (client-side check)
const ENABLE_EMAIL_PASSWORD =
  import.meta.env.VITE_ENABLE_EMAIL_PASSWORD !== "false";
const ENABLE_MAGIC_LINK = import.meta.env.VITE_ENABLE_MAGIC_LINK !== "false";
const ENABLE_GOOGLE = import.meta.env.VITE_ENABLE_GOOGLE === "true";
const ENABLE_MICROSOFT = import.meta.env.VITE_ENABLE_MICROSOFT === "true";
const ENABLE_APPLE = import.meta.env.VITE_ENABLE_APPLE === "true";

type AuthMode = "login" | "magic-link";

// Validation schemas
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const magicLinkSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type MagicLinkFormData = z.infer<typeof magicLinkSchema>;

export function LoginForm() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/login" });

  // Create form instances
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const magicLinkForm = useForm<MagicLinkFormData>({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: {
      email: "",
    },
  });

  const handleLogin = async (data: LoginFormData) => {
    setError(null);
    setLoading(true);

    try {
      const result = await authClient.signIn.email({
        email: data.email,
        password: data.password,
      });

      if (result.error) {
        setError(result.error.message || "An error occurred");
        return;
      }

      // Redirect after successful login
      navigate({ to: redirect || "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async (data: MagicLinkFormData) => {
    setError(null);
    setLoading(true);

    try {
      const result = await authClient.signIn.magicLink({
        email: data.email,
        callbackURL: redirect || "/",
      });

      if (result.error) {
        setError(result.error.message || "An error occurred");
        return;
      }

      setMagicLinkSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (
    provider: "google" | "microsoft" | "apple"
  ) => {
    setError(null);
    setLoading(true);

    try {
      await authClient.signIn.social({
        provider,
        callbackURL: redirect || "/",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
    }
  };

  if (magicLinkSent) {
    return (
      <div className="p-4 bg-success/10 border border-success rounded-lg">
        <p className="text-success font-medium">Magic link sent!</p>
        <p className="text-sm text-text-muted mt-2">
          Check your email for a sign-in link. It will expire in 15 minutes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-danger/10 border border-danger rounded-lg">
          <p className="text-danger text-sm">{error}</p>
        </div>
      )}

      {/* Email/Password Form */}
      {ENABLE_EMAIL_PASSWORD && mode === "login" && (
        <Form form={loginForm} onSubmit={handleLogin} className="space-y-4">
          <BaseInput
            name="email"
            type="email"
            label="Email"
            placeholder="you@example.com"
            disabled={loading}
          />
          <BaseInput
            name="password"
            type="password"
            label="Password"
            placeholder="••••••••"
            disabled={loading}
          />

          <Button type="submit" variant="primary" className="w-full">
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </Form>
      )}

      {/* Magic Link Form */}
      {ENABLE_MAGIC_LINK && mode === "magic-link" && (
        <Form
          form={magicLinkForm}
          onSubmit={handleMagicLink}
          className="space-y-4"
        >
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
            className="w-full"
          >
            {loading ? "Sending..." : "Send Magic Link"}
          </Button>
        </Form>
      )}

      {/* Mode Toggle and Links */}
      <div className="flex flex-col gap-3 text-sm">
        {ENABLE_EMAIL_PASSWORD && ENABLE_MAGIC_LINK && (
          <div className="flex gap-2 justify-center">
            {mode === "login" && (
              <button
                type="button"
                onClick={() => {
                  setMode("magic-link");
                  setError(null);
                  magicLinkForm.reset();
                }}
                className="text-primary hover:underline"
              >
                Use magic link instead
              </button>
            )}
            {mode === "magic-link" && (
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                  loginForm.reset();
                }}
                className="text-primary hover:underline"
              >
                Use password instead
              </button>
            )}
          </div>
        )}
        <div className="text-center">
          <span className="text-text-muted">Don't have an account? </span>
          <Link
            to="/register"
            search={{ redirect }}
            className="text-primary hover:underline"
          >
            Create account
          </Link>
        </div>
      </div>

      {/* Social Providers */}
      {(ENABLE_GOOGLE || ENABLE_MICROSOFT || ENABLE_APPLE) && (
        <div className="space-y-3">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background text-text-muted">
                Or continue with
              </span>
            </div>
          </div>

          <div className="grid gap-3">
            {ENABLE_GOOGLE && (
              <Button
                variant="default"
                clicked={() => handleSocialLogin("google")}
                disabled={loading}
                className="w-full"
              >
                Continue with Google
              </Button>
            )}
            {ENABLE_MICROSOFT && (
              <Button
                variant="default"
                clicked={() => handleSocialLogin("microsoft")}
                disabled={loading}
                className="w-full"
              >
                Continue with Microsoft
              </Button>
            )}
            {ENABLE_APPLE && (
              <Button
                variant="default"
                clicked={() => handleSocialLogin("apple")}
                disabled={loading}
                className="w-full"
              >
                Continue with Apple
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
