/**
 * Register Form Component
 *
 * Registration form supporting:
 * - Email/password registration
 */

import { Button } from "@/features/ui/button/button";
import { Form } from "@/features/ui/form/form";
import { useFinForm } from "@/features/ui/form/useForm";
import { BaseInput } from "@/features/ui/input/input";
import { TextInput } from "@/features/ui/input/text-input";
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

// Validation schema
const registerSchema = z.object({
  firstname: z.string().min(1, "Firstname is required"),
  suffix: z.string().optional(),
  lastname: z.string().min(1, "Lastname is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const toast = useToast();

  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/register" });

  const registerForm = useFinForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstname: "",
      suffix: undefined,
      lastname: "",
      email: "",
      password: "",
    },
  });

  const handleRegister = async (data: RegisterFormData) => {
    setError(null);
    setLoading(true);

    try {
      const suffix = data.suffix ? `${data.suffix} ` : "";
      const name = `${data.firstname} ${suffix}${data.lastname}`;

      const result = await authClient.signUp.email({
        email: data.email,
        password: data.password,
        name,
        firstName: data.firstname,
        lastName: data.lastname,
        suffix: data.suffix || undefined,
      });

      if (result.error) {
        setError(result.error.message || "An error occurred");
        toast.error(result.error.message || "Registration failed");
        return;
      }

      setRegistrationSuccess(true);
      toast.success(
        "Account created successfully! Please check your email to verify your account."
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    const email = registerForm.getValues("email");
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
      }
    } catch (err) {
      toast.error("Failed to send verification email");
    } finally {
      setResendLoading(false);
    }
  };

  if (!ENABLE_EMAIL_PASSWORD) {
    return (
      <div className="p-4 bg-warning/10 border border-warning rounded-2xl">
        <p className="text-warning text-sm">
          Email/password registration is currently disabled.
        </p>
      </div>
    );
  }

  if (registrationSuccess) {
    return (
      <div className="space-y-6">
        <div className="p-4 bg-success/10 border border-success rounded-2xl space-y-4">
          <p className="text-success text-sm font-medium">
            Account created successfully!
          </p>
          <p className="text-text-muted text-sm">
            Please check your email to verify your account before logging in.
          </p>
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              clicked={handleResendVerification}
              disabled={resendLoading}
              className="w-full"
              loading={{
                isLoading: resendLoading,
                text: "Sending verification email",
              }}>
              Resend verification email
            </Button>
            <NavLink
              to="/login"
              search={{ redirect }}
              className="text-center text-sm">
              Continue to login
            </NavLink>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-danger/10 border border-danger rounded-2xl">
          <p className="text-danger text-sm">{error}</p>
        </div>
      )}

      {/* Registration Form */}
      <Form
        form={registerForm}
        onSubmit={handleRegister}
        className="space-y-4">
        <div className="gap-4 grid grid-cols-[70%_30%]">
          <TextInput
            name="firstname"
            label="Firstname"
            placeholder="Your firstname"
            disabled={loading}
          />

          <TextInput
            name="suffix"
            label="Suffix (optional)"
            placeholder="Your suffix"
            disabled={loading}
          />
        </div>

        <TextInput
          name="lastname"
          label="Lastname"
          placeholder="Your lastname"
          disabled={loading}
        />

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
          hint="Password must be at least 8 characters"
        />

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          loading={{
            isLoading: loading,
            text: "Creating account",
          }}>
          Sign Up
        </Button>
      </Form>

      {/* Link to Login */}
      <div className="text-center text-sm">
        <span className="text-text-muted">Already have an account? </span>
        <NavLink
          to="/login"
          search={{ redirect }}>
          Sign in instead
        </NavLink>
      </div>
    </div>
  );
}
