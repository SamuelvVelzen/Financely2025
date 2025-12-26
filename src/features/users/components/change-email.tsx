import type { IChangeEmailInput } from "@/features/shared/validation/schemas";
import { ChangeEmailInputSchema } from "@/features/shared/validation/schemas";
import { Button } from "@/features/ui/button/button";
import { Container } from "@/features/ui/container/container";
import { UnsavedChangesDialog } from "@/features/ui/dialog/unsaved-changes-dialog";
import { Form } from "@/features/ui/form/form";
import { useFinForm } from "@/features/ui/form/useForm";
import { BaseInput } from "@/features/ui/input/input";
import { useToast } from "@/features/ui/toast";
import { Label } from "@/features/ui/typography/label";
import { ScrollableHeader } from "@/features/ui/typography/scrollable-header";
import { useChangeEmail } from "@/features/users/hooks/useChangeEmail";
import { useMyProfile } from "@/features/users/hooks/useMyProfile";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";

export function ChangeEmail() {
  const { data: profile } = useMyProfile();
  const changeEmail = useChangeEmail();
  const toast = useToast();
  const [showEmailUnsavedDialog, setShowEmailUnsavedDialog] = useState(false);

  const emailForm = useFinForm<IChangeEmailInput>({
    resolver: zodResolver(ChangeEmailInputSchema),
    defaultValues: {
      newEmail: "",
    },
  });

  const handleEmailSubmit = async (data: IChangeEmailInput) => {
    try {
      await changeEmail.mutateAsync(data);
      toast.success("Verification email sent to your new address");
      emailForm.reset();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to change email"
      );
    }
  };

  const handleCancelEmail = () => {
    const hasUnsavedChanges = emailForm.formState.isDirty;
    if (hasUnsavedChanges) {
      setShowEmailUnsavedDialog(true);
      return;
    }
    emailForm.reset();
  };

  const handleDiscardEmailChanges = () => {
    emailForm.reset();
    setShowEmailUnsavedDialog(false);
  };

  if (!profile) {
    return null;
  }

  return (
    <>
      <Container className="mb-4">
        <ScrollableHeader
          id="change-email"
          className="mb-4">
          Change Email
        </ScrollableHeader>
        <div className="grid gap-4 sm:grid-cols-2 mb-4">
          <div>
            <Label>Current Email</Label>
            <p className="text-text mt-1">{profile.email}</p>
          </div>
          <div>
            <Label>Email Verified</Label>
            <p className="mt-1">
              {profile.emailVerified ? (
                <span className="inline-flex items-center gap-1 text-success">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-warning">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Not verified
                </span>
              )}
            </p>
          </div>
        </div>

        <Form
          form={emailForm}
          onSubmit={handleEmailSubmit}
          className="space-y-4">
          <BaseInput
            name="newEmail"
            type="email"
            label="New Email Address"
            placeholder="new@example.com"
            disabled={changeEmail.isPending}
            hint="A verification email will be sent to your new address. Your email
              will only update after you verify it."
          />
          <div className="flex justify-end gap-2 pt-2">
            {emailForm.formState.isDirty && (
              <Button
                type="button"
                variant="default"
                clicked={handleCancelEmail}
                disabled={changeEmail.isPending}>
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              variant="primary"
              disabled={changeEmail.isPending || !emailForm.formState.isDirty}>
              {changeEmail.isPending ? "Sending..." : "Send Verification"}
            </Button>
          </div>
        </Form>
      </Container>

      <UnsavedChangesDialog
        open={showEmailUnsavedDialog}
        onConfirm={handleDiscardEmailChanges}
        onCancel={() => setShowEmailUnsavedDialog(false)}
      />
    </>
  );
}
