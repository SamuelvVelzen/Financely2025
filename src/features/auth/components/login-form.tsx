/**
 * Login Form Component
 *
 * Unified authentication form supporting:
 * - Email/password login
 * - Magic link
 * - Social OAuth providers (Google, Microsoft, Apple)
 */

import { Button } from "@/features/ui/button/button";
import { Form } from "@/features/ui/form/form";
import { BaseInput } from "@/features/ui/input/input";
import { authClient } from "@/lib/auth-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useSearch } from "@tanstack/react-router";
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

type AuthMode = "login" | "register" | "magic-link";

interface LoginFormProps {
  defaultMode?: AuthMode;
}

// Validation schemas
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const registerSchema = z.object({
  name: z.string().min(1, "Name is required").optional().or(z.literal("")),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const magicLinkSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;
type MagicLinkFormData = z.infer<typeof magicLinkSchema>;

export function LoginForm({ defaultMode = "login" }: LoginFormProps) {
  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const navigate = useNavigate();

  const { redirect } = useSearch({ from: "/login" });

  // Create form instances based on mode
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
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

  const handleEmailPassword = async (
    data: LoginFormData | RegisterFormData
  ) => {
    setError(null);
    setLoading(true);

    try {
      if (mode === "register") {
        const registerData = data as RegisterFormData;
        const result = await authClient.signUp.email({
          email: registerData.email,
          password: registerData.password,
          name: registerData.name || "User",
        });

        if (result.error) {
          setError(result.error.message || "An error occurred");
          return;
        }

        // Redirect after successful registration
        navigate({ to: redirect || "/" });
      } else {
        const loginData = data as LoginFormData;
        const result = await authClient.signIn.email({
          email: loginData.email,
          password: loginData.password,
        });

        if (result.error) {
          setError(result.error.message || "An error occurred");
          return;
        }

        // Redirect after successful login
        navigate({ to: redirect || "/" });
      }
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
      {ENABLE_EMAIL_PASSWORD && mode !== "magic-link" && (
        <Form
          form={mode === "register" ? registerForm : loginForm}
          onSubmit={handleEmailPassword}
          className="space-y-4"
        >
          {mode === "register" && (
            <BaseInput
              name="name"
              label="Name (optional)"
              placeholder="Your name"
              disabled={loading}
            />
          )}
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
            {loading
              ? "Loading..."
              : mode === "register"
                ? "Sign Up"
                : "Sign In"}
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

      {/* Mode Toggle */}
      {ENABLE_EMAIL_PASSWORD && (
        <div className="flex gap-2 text-sm">
          {mode !== "login" && (
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
                loginForm.reset();
              }}
              className="text-primary hover:underline"
            >
              Sign in instead
            </button>
          )}
          {mode !== "register" && (
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError(null);
                registerForm.reset();
              }}
              className="text-primary hover:underline"
            >
              Create account
            </button>
          )}
          {ENABLE_MAGIC_LINK && mode !== "magic-link" && (
            <button
              type="button"
              onClick={() => {
                setMode("magic-link");
                setError(null);
                magicLinkForm.reset();
              }}
              className="text-primary hover:underline"
            >
              Use magic link
            </button>
          )}
        </div>
      )}

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
