import type { IChangePasswordInput } from "@/features/shared/validation/schemas";
import { ChangePasswordInputSchema } from "@/features/shared/validation/schemas";
import { Button } from "@/features/ui/button/button";
import { Container } from "@/features/ui/container/container";
import { UnsavedChangesDialog } from "@/features/ui/dialog/unsaved-changes-dialog";
import { Form } from "@/features/ui/form/form";
import { BaseInput } from "@/features/ui/input/input";
import { useToast } from "@/features/ui/toast";
import { useChangePassword } from "@/features/users/hooks/useChangePassword";
import { useConnectedAccounts } from "@/features/users/hooks/useConnectedAccounts";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

export function ChangePassword() {
  const { data: accountsData } = useConnectedAccounts();
  const changePassword = useChangePassword();
  const toast = useToast();
  const [showPasswordUnsavedDialog, setShowPasswordUnsavedDialog] =
    useState(false);

  const passwordForm = useForm<IChangePasswordInput>({
    resolver: zodResolver(ChangePasswordInputSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const handlePasswordSubmit = async (data: IChangePasswordInput) => {
    try {
      await changePassword.mutateAsync({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success("Password changed successfully");
      passwordForm.reset();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to change password"
      );
    }
  };

  const handleCancelPassword = () => {
    const hasUnsavedChanges = passwordForm.formState.isDirty;
    if (hasUnsavedChanges) {
      setShowPasswordUnsavedDialog(true);
      return;
    }
    passwordForm.reset();
  };

  const handleDiscardPasswordChanges = () => {
    passwordForm.reset();
    setShowPasswordUnsavedDialog(false);
  };

  // Only show if user has a password
  if (!accountsData?.hasPassword) {
    return null;
  }

  return (
    <>
      <Container>
        <h2 className="text-lg font-semibold text-text mb-4">
          Change Password
        </h2>
        <Form
          form={passwordForm}
          onSubmit={handlePasswordSubmit}
          className="space-y-4">
          <BaseInput
            name="currentPassword"
            type="password"
            label="Current Password"
            placeholder="Enter current password"
            disabled={changePassword.isPending}
          />
          <BaseInput
            name="newPassword"
            type="password"
            label="New Password"
            placeholder="Enter new password"
            disabled={changePassword.isPending}
          />
          <BaseInput
            name="confirmPassword"
            type="password"
            label="Confirm New Password"
            placeholder="Confirm new password"
            disabled={changePassword.isPending}
          />

          <div className="flex justify-end gap-2 pt-2">
            {passwordForm.formState.isDirty && (
              <Button
                type="button"
                variant="default"
                clicked={handleCancelPassword}
                disabled={changePassword.isPending}>
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              variant="primary"
              disabled={
                changePassword.isPending || !passwordForm.formState.isDirty
              }>
              {changePassword.isPending ? "Changing..." : "Change Password"}
            </Button>
          </div>
        </Form>
      </Container>

      <UnsavedChangesDialog
        open={showPasswordUnsavedDialog}
        onConfirm={handleDiscardPasswordChanges}
        onCancel={() => setShowPasswordUnsavedDialog(false)}
      />
    </>
  );
}
