import { MagicLinkForm } from "@/features/auth/components/magic-link-form";
import { SocialProviders } from "@/features/auth/components/social-providers";
import { Button } from "@/features/ui/button/button";
import { LinkButton } from "@/features/ui/button/link-button";
import { Form } from "@/features/ui/form/form";
import { useFinForm } from "@/features/ui/form/useForm";
import { BaseInput } from "@/features/ui/input/input";
import { PasswordInput } from "@/features/ui/input/password-input";
import { NavLink } from "@/features/ui/navigation/nav-link";
import { useToast } from "@/features/ui/toast";
import { authClient } from "@/lib/auth-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
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

type ILoginFormData = z.infer<typeof loginSchema>;
type IMagicLinkFormData = z.infer<typeof magicLinkSchema>;

export function LoginForm() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [showResendButton, setShowResendButton] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const toast = useToast();

  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/login" });

  // Create form instances
  const loginForm = useFinForm<ILoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const magicLinkForm = useFinForm<IMagicLinkFormData>({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: {
      email: "",
    },
  });

  const handleLogin = async (data: ILoginFormData) => {
    setError(null);
    setShowResendButton(false);
    setLoading(true);

    try {
      const result = await authClient.signIn.email(
        {
          email: data.email,
          password: data.password,
        },
        {
          onError: (ctx) => {
            // BetterAuth returns 403 for unverified emails
            if (ctx.error.status === 403) {
              setError("Please verify your email address before logging in.");
              setShowResendButton(true);
            } else {
              setError(ctx.error.message || "An error occurred");
            }
          },
        }
      );

      if (result.error) {
        // Fallback error handling
        if (result.error.status === 403) {
          setError("Please verify your email address before logging in.");
          setShowResendButton(true);
        } else {
          setError(result.error.message || "An error occurred");
        }
        toast.error(result.error.message || "Login failed");
        return;
      }

      toast.success("Welcome back!");
      // Redirect after successful login
      navigate({ to: redirect || "/" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    const email = loginForm.getValues("email");
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setResendLoading(true);
    try {
      const result = await authClient.sendVerificationEmail({
        email,
        callbackURL: redirect || "/",
      });

      if (result.error) {
        toast.error(
          result.error.message || "Failed to send verification email"
        );
      } else {
        toast.success("Verification email sent! Please check your inbox.");
        setShowResendButton(false);
      }
    } catch (err) {
      toast.error("Failed to send verification email");
    } finally {
      setResendLoading(false);
    }
  };

  const handleMagicLink = async (data: IMagicLinkFormData) => {
    setError(null);
    setLoading(true);

    try {
      const result = await authClient.signIn.magicLink({
        email: data.email,
        callbackURL: redirect || "/",
      });

      if (result.error) {
        setError(result.error.message || "An error occurred");
        toast.error(result.error.message || "Failed to send magic link");
        return;
      }

      setMagicLinkSent(true);
      toast.success("Magic link sent! Check your email.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
      toast.error(message);
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

  const handleSwitchToMagicLink = () => {
    setMode("magic-link");
    setError(null);
    magicLinkForm.reset();
  };

  const handleSwitchToPassword = () => {
    setMode("login");
    setError(null);
    loginForm.reset();
  };

  // Watch email value for reset password link
  const emailValue = loginForm.watch("email");

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-danger/10 border border-danger rounded-lg space-y-2">
          <p className="text-danger text-sm">{error}</p>
          {ENABLE_EMAIL_PASSWORD && mode === "login" && (
            <div className="flex flex-col gap-2 text-sm">
              {showResendButton && (
                <Button
                  type="button"
                  variant="secondary"
                  clicked={handleResendVerification}
                  disabled={resendLoading}
                  className="w-full"
                  loading={{
                    isLoading: resendLoading,
                    text: "Sending verification email",
                  }}>
                  Resend verification email
                </Button>
              )}
              <NavLink
                to="/reset-password"
                search={{ email: emailValue || null, token: null }}>
                Forgot your password?
              </NavLink>
            </div>
          )}
        </div>
      )}

      {/* Email/Password Form */}
      {ENABLE_EMAIL_PASSWORD && mode === "login" && (
        <Form
          form={loginForm}
          onSubmit={handleLogin}
          className="space-y-4">
          <BaseInput
            name="email"
            type="email"
            label="Email"
            placeholder="you@example.com"
            disabled={loading}
          />
          <PasswordInput
            name="password"
            label="Password"
            placeholder="••••••••"
            disabled={loading}
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            loading={{
              isLoading: loading,
              text: "Signing in",
            }}>
            Sign In
          </Button>
        </Form>
      )}

      {/* Magic Link Form */}
      {ENABLE_MAGIC_LINK && mode === "magic-link" && (
        <MagicLinkForm
          form={magicLinkForm}
          onSubmit={handleMagicLink}
          loading={loading}
          magicLinkSent={magicLinkSent}
          onSwitchToPassword={handleSwitchToPassword}
          showPasswordToggle={ENABLE_EMAIL_PASSWORD}
        />
      )}

      {/* Mode Toggle and Links */}
      <div className="flex flex-col gap-3 text-sm">
        {ENABLE_EMAIL_PASSWORD && ENABLE_MAGIC_LINK && mode === "login" && (
          <div className="flex gap-2 justify-center">
            <LinkButton
              clicked={() => handleSwitchToMagicLink()}
              variant="primary">
              Use magic link instead
            </LinkButton>
          </div>
        )}
        <div className="text-center">
          <span className="text-text-muted">Don't have an account? </span>
          <NavLink
            href="/register"
            to="/register"
            search={{ redirect }}>
            Create account
          </NavLink>
        </div>
      </div>

      {/* Social Providers */}
      <SocialProviders
        enabledProviders={{
          google: ENABLE_GOOGLE,
          microsoft: ENABLE_MICROSOFT,
          apple: ENABLE_APPLE,
        }}
        onProviderClick={handleSocialLogin}
        loading={loading}
      />
    </div>
  );
}
