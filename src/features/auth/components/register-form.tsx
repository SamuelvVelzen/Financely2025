/**
 * Register Form Component
 *
 * Registration form supporting:
 * - Email/password registration
 */

import { Button } from "@/features/ui/button/button";
import { Form } from "@/features/ui/form/form";
import { BaseInput } from "@/features/ui/input/input";
import { TextInput } from "@/features/ui/input/text-input";
import { NavLink } from "@/features/ui/navigation/nav-link";
import { authClient } from "@/lib/auth-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
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

  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/register" });

  const registerForm = useForm<RegisterFormData>({
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
        return;
      }

      // Redirect after successful registration
      navigate({ to: redirect || "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!ENABLE_EMAIL_PASSWORD) {
    return (
      <div className="p-4 bg-warning/10 border border-warning rounded-lg">
        <p className="text-warning text-sm">
          Email/password registration is currently disabled.
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

      {/* Registration Form */}
      <Form form={registerForm} onSubmit={handleRegister} className="space-y-4">
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
        />

        <Button type="submit" variant="primary" className="w-full">
          {loading ? "Creating account..." : "Sign Up"}
        </Button>
      </Form>

      {/* Link to Login */}
      <div className="text-center text-sm">
        <span className="text-text-muted">Already have an account? </span>
        <NavLink to="/login" search={{ redirect }}>
          Sign in instead
        </NavLink>
      </div>
    </div>
  );
}
