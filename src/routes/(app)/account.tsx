import type {
  IChangeEmailInput,
  IChangePasswordInput,
  IUpdateUserProfileInput,
} from "@/features/shared/validation/schemas";
import {
  ChangeEmailInputSchema,
  ChangePasswordInputSchema,
  UpdateUserProfileInputSchema,
} from "@/features/shared/validation/schemas";
import { Button } from "@/features/ui/button/button";
import { IconButton } from "@/features/ui/button/icon-button";
import { Container } from "@/features/ui/container/container";
import { UnsavedChangesDialog } from "@/features/ui/dialog/unsaved-changes-dialog";
import { Form } from "@/features/ui/form/form";
import { BaseInput } from "@/features/ui/input/input";
import { TextInput } from "@/features/ui/input/text-input";
import { useToast } from "@/features/ui/toast";
import { Label } from "@/features/ui/typography/label";
import { Title } from "@/features/ui/typography/title";
import { useChangeEmail } from "@/features/users/hooks/useChangeEmail";
import { useChangePassword } from "@/features/users/hooks/useChangePassword";
import {
  useConnectedAccounts,
  useLinkSocialAccount,
  useUnlinkAccount,
} from "@/features/users/hooks/useConnectedAccounts";
import { useMyProfile } from "@/features/users/hooks/useMyProfile";
import { useUpdateProfile } from "@/features/users/hooks/useUpdateProfile";
import { getEnabledSocialProviders } from "@/lib/auth-config";
import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

export const Route = createFileRoute("/(app)/account")({
  component: AccountPage,
  head: () => ({
    meta: [
      {
        title: "Account | Financely",
      },
    ],
  }),
});

// Provider display info
const PROVIDER_INFO: Record<
  string,
  { name: string; icon: React.ReactNode; color: string }
> = {
  google: {
    name: "Google",
    icon: (
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="currentColor"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="currentColor"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="currentColor"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
    ),
    color: "text-[#4285F4]",
  },
  microsoft: {
    name: "Microsoft",
    icon: (
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24">
        <path
          fill="#F25022"
          d="M1 1h10v10H1z"
        />
        <path
          fill="#00A4EF"
          d="M1 13h10v10H1z"
        />
        <path
          fill="#7FBA00"
          d="M13 1h10v10H13z"
        />
        <path
          fill="#FFB900"
          d="M13 13h10v10H13z"
        />
      </svg>
    ),
    color: "text-text",
  },
  apple: {
    name: "Apple",
    icon: (
      <svg
        className="w-5 h-5"
        fill="currentColor"
        viewBox="0 0 24 24">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
      </svg>
    ),
    color: "text-text",
  },
  credential: {
    name: "Password",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      </svg>
    ),
    color: "text-text-muted",
  },
};

// Get available social providers from auth config
const AVAILABLE_PROVIDERS = getEnabledSocialProviders();

function AccountPage() {
  const { data: profile, isLoading: profileLoading, error } = useMyProfile();
  const { data: accountsData, isLoading: accountsLoading } =
    useConnectedAccounts();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const changeEmail = useChangeEmail();
  const unlinkAccount = useUnlinkAccount();
  const linkSocial = useLinkSocialAccount();
  const toast = useToast();
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [showEmailUnsavedDialog, setShowEmailUnsavedDialog] = useState(false);
  const [showPasswordUnsavedDialog, setShowPasswordUnsavedDialog] =
    useState(false);

  // Profile form
  const profileForm = useForm<IUpdateUserProfileInput>({
    resolver: zodResolver(UpdateUserProfileInputSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      suffix: "",
    },
  });

  // Password form
  const passwordForm = useForm<IChangePasswordInput>({
    resolver: zodResolver(ChangePasswordInputSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Email form
  const emailForm = useForm<IChangeEmailInput>({
    resolver: zodResolver(ChangeEmailInputSchema),
    defaultValues: {
      newEmail: "",
    },
  });

  // Reset profile form when data loads
  useEffect(() => {
    if (profile) {
      profileForm.reset({
        firstName: profile.firstName,
        lastName: profile.lastName,
        suffix: profile.suffix || "",
      });
    }
  }, [profile, profileForm]);

  const handleProfileSubmit = async (data: IUpdateUserProfileInput) => {
    try {
      await updateProfile.mutateAsync(data);
      toast.success("Profile updated successfully");
      setIsEditingProfile(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update profile"
      );
    }
  };

  const handleCancelEdit = () => {
    const hasUnsavedChanges = profileForm.formState.isDirty;
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
      return;
    }
    setIsEditingProfile(false);
  };

  const handleDiscardChanges = () => {
    if (profile) {
      profileForm.reset({
        firstName: profile.firstName,
        lastName: profile.lastName,
        suffix: profile.suffix || "",
      });
    }
    setShowUnsavedDialog(false);
    setIsEditingProfile(false);
  };

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

  const handleUnlinkAccount = async (accountId: string) => {
    setUnlinkingId(accountId);
    try {
      await unlinkAccount.mutateAsync(accountId);
      toast.success("Account disconnected");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to disconnect account"
      );
    } finally {
      setUnlinkingId(null);
    }
  };

  const handleLinkSocial = async (
    provider: "google" | "microsoft" | "apple"
  ) => {
    try {
      await linkSocial.mutateAsync({ provider });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : `Failed to connect ${provider}`
      );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const isLoading = profileLoading || accountsLoading;

  // Get connected provider IDs
  const connectedProviderIds =
    accountsData?.accounts.map((a) => a.providerId) || [];
  const availableToConnect = AVAILABLE_PROVIDERS.filter(
    (p) => !connectedProviderIds.includes(p)
  );

  return (
    <>
      <Container className="mb-4">
        <Title>Account</Title>
        <p className="text-text-muted">
          Manage your account settings and preferences.
        </p>
      </Container>

      {isLoading && (
        <Container>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-surface-hover rounded w-1/4" />
            <div className="h-10 bg-surface-hover rounded w-full" />
            <div className="h-4 bg-surface-hover rounded w-1/4" />
            <div className="h-10 bg-surface-hover rounded w-full" />
          </div>
        </Container>
      )}

      {error && (
        <Container>
          <div className="p-4 bg-danger/10 border border-danger rounded-lg">
            <p className="text-danger text-sm">{error.message}</p>
          </div>
        </Container>
      )}

      {profile && !isLoading && (
        <>
          {/* Profile Information Section */}
          <Container className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text">
                Profile Information
              </h2>
              <IconButton
                clicked={
                  isEditingProfile
                    ? handleCancelEdit
                    : () => setIsEditingProfile(true)
                }
                aria-label={
                  isEditingProfile ? "Cancel editing" : "Edit profile"
                }>
                {isEditingProfile ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                )}
              </IconButton>
            </div>

            <Form
              form={profileForm}
              onSubmit={isEditingProfile ? handleProfileSubmit : () => {}}
              className="space-y-4">
              {/* First Name and Suffix Row */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* First Name */}
                {isEditingProfile ? (
                  <TextInput
                    name="firstName"
                    label="First Name"
                    placeholder="Your first name"
                    disabled={updateProfile.isPending}
                  />
                ) : (
                  <div>
                    <Label>First Name</Label>
                    <p className="text-text mt-1">
                      {profile.firstName || (
                        <span className="text-text-muted">Not set</span>
                      )}
                    </p>
                  </div>
                )}

                {/* Suffix */}
                {isEditingProfile ? (
                  <TextInput
                    name="suffix"
                    label="Suffix (optional)"
                    placeholder="Jr., Sr., III"
                    disabled={updateProfile.isPending}
                  />
                ) : (
                  <div>
                    <Label>Suffix</Label>
                    <p className="text-text mt-1">
                      {profile.suffix || (
                        <span className="text-text-muted">-</span>
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* Last Name */}
              {isEditingProfile ? (
                <TextInput
                  name="lastName"
                  label="Last Name"
                  placeholder="Your last name"
                  disabled={updateProfile.isPending}
                />
              ) : (
                <div>
                  <Label>Last Name</Label>
                  <p className="text-text mt-1">
                    {profile.lastName || (
                      <span className="text-text-muted">Not set</span>
                    )}
                  </p>
                </div>
              )}

              {/* Email, Member Since, Last Updated */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Email (read-only) */}
                <div className="col-span-2">
                  <Label>Email</Label>
                  <p className="text-text mt-1">{profile.email}</p>
                </div>

                {/* Member Since (read-only) */}
                <div>
                  <Label>Member Since</Label>
                  <p className="text-text mt-1">
                    {formatDate(profile.createdAt)}
                  </p>
                </div>

                {/* Last Updated (read-only) */}
                <div>
                  <Label>Last Updated</Label>
                  <p className="text-text mt-1">
                    {formatDate(profile.updatedAt)}
                  </p>
                </div>
              </div>

              {isEditingProfile && (
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="default"
                    clicked={handleCancelEdit}
                    disabled={updateProfile.isPending}>
                    Cancel
                  </Button>

                  <Button
                    type="submit"
                    variant="primary"
                    disabled={
                      updateProfile.isPending || !profileForm.formState.isDirty
                    }>
                    {updateProfile.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              )}
            </Form>
          </Container>

          {/* Connected Accounts */}
          <Container className="mb-4">
            <h2 className="text-lg font-semibold text-text mb-4">
              Connected Accounts
            </h2>
            <p className="text-sm text-text-muted mb-4">
              Manage your connected login methods. You must keep at least one
              method to sign in.
            </p>

            {/* Connected accounts list */}
            <div className="space-y-3 mb-4">
              {accountsData?.accounts.map((account) => {
                const info = PROVIDER_INFO[account.providerId] || {
                  name: account.providerId,
                  icon: null,
                  color: "text-text",
                };
                const canUnlink = (accountsData?.accounts.length || 0) > 1;

                return (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-3 bg-surface border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className={info.color}>{info.icon}</span>
                      <div>
                        <p className="font-medium text-text">{info.name}</p>
                        <p className="text-xs text-text-muted">
                          Connected {formatDate(account.createdAt)}
                        </p>
                      </div>
                    </div>
                    {account.providerId !== "credential" && (
                      <Button
                        variant="danger"
                        size="sm"
                        clicked={() => handleUnlinkAccount(account.id)}
                        disabled={!canUnlink || unlinkingId === account.id}>
                        {unlinkingId === account.id
                          ? "Disconnecting..."
                          : "Disconnect"}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Available to connect */}
            {availableToConnect.length > 0 && (
              <>
                <p className="text-sm font-medium text-text mb-2">
                  Connect another account
                </p>
                <div className="flex flex-wrap gap-2">
                  {availableToConnect.map((provider) => {
                    const info = PROVIDER_INFO[provider];
                    return (
                      <Button
                        key={provider}
                        variant="default"
                        clicked={() => handleLinkSocial(provider)}
                        disabled={linkSocial.isPending}
                        className="whitespace-nowrap flex-1">
                        <span className={`mr-2 ${info.color}`}>
                          {info.icon}
                        </span>
                        Connect {info.name}
                      </Button>
                    );
                  })}
                </div>
              </>
            )}
          </Container>

          <Container className="mb-4">
            <h2 className="text-lg font-semibold text-text mb-4">
              Change Email
            </h2>
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
                  disabled={
                    changeEmail.isPending || !emailForm.formState.isDirty
                  }>
                  {changeEmail.isPending ? "Sending..." : "Send Verification"}
                </Button>
              </div>
            </Form>
          </Container>

          {/* Change Password (only if user has a password) */}
          {accountsData?.hasPassword && (
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
                      changePassword.isPending ||
                      !passwordForm.formState.isDirty
                    }>
                    {changePassword.isPending
                      ? "Changing..."
                      : "Change Password"}
                  </Button>
                </div>
              </Form>
            </Container>
          )}
        </>
      )}

      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onConfirm={handleDiscardChanges}
        onCancel={() => setShowUnsavedDialog(false)}
      />
      <UnsavedChangesDialog
        open={showEmailUnsavedDialog}
        onConfirm={handleDiscardEmailChanges}
        onCancel={() => setShowEmailUnsavedDialog(false)}
      />
      <UnsavedChangesDialog
        open={showPasswordUnsavedDialog}
        onConfirm={handleDiscardPasswordChanges}
        onCancel={() => setShowPasswordUnsavedDialog(false)}
      />
    </>
  );
}
