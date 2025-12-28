/**
 * Magic Link Form Component
 *
 * Presentational component for magic link authentication.
 * Receives form instance and handlers as props.
 */

import { Button } from "@/features/ui/button/button";
import { LinkButton } from "@/features/ui/button/link-button";
import { Form } from "@/features/ui/form/form";
import { BaseInput } from "@/features/ui/input/input";
import { type UseFormReturn } from "react-hook-form";

export type IMagicLinkFormData = {
  email: string;
};

interface MagicLinkFormProps {
  form: UseFormReturn<IMagicLinkFormData>;
  onSubmit: (data: IMagicLinkFormData) => void;
  loading: boolean;
  magicLinkSent: boolean;
  onSwitchToPassword: () => void;
  showPasswordToggle?: boolean;
}

export function MagicLinkForm({
  form,
  onSubmit,
  loading,
  magicLinkSent,
  onSwitchToPassword,
  showPasswordToggle = true,
}: MagicLinkFormProps) {
  if (magicLinkSent) {
    return (
      <div className="p-4 bg-success/10 border border-success rounded-2xl">
        <p className="text-success font-medium">Magic link sent!</p>
        <p className="text-sm text-text-muted mt-2">
          Check your email for a sign-in link. It will expire in 15 minutes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Form
        form={form}
        onSubmit={onSubmit}
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
          className="w-full"
          loading={{
            isLoading: loading,
            text: "Sending magic link",
          }}>
          Send Magic Link
        </Button>
      </Form>

      {showPasswordToggle && (
        <LinkButton
          clicked={onSwitchToPassword}
          variant="primary"
          className="mx-auto">
          Use password instead
        </LinkButton>
      )}
    </div>
  );
}
