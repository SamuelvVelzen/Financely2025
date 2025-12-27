import type { IUpdateUserProfileInput } from "@/features/shared/validation/schemas";
import { UpdateUserProfileInputSchema } from "@/features/shared/validation/schemas";
import { Button } from "@/features/ui/button/button";
import { IconButton } from "@/features/ui/button/icon-button";
import { Container } from "@/features/ui/container/container";
import { UnsavedChangesDialog } from "@/features/ui/dialog/unsaved-changes-dialog";
import { Form } from "@/features/ui/form/form";
import { useFinForm } from "@/features/ui/form/useForm";
import { TextInput } from "@/features/ui/input/text-input";
import { useToast } from "@/features/ui/toast";
import { Label } from "@/features/ui/typography/label";
import { ScrollableHeader } from "@/features/ui/typography/scrollable-header";
import { useMyProfile } from "@/features/users/hooks/useMyProfile";
import { useUpdateProfile } from "@/features/users/hooks/useUpdateProfile";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";

export function ProfileInformation() {
  const { data: profile } = useMyProfile();
  const updateProfile = useUpdateProfile();
  const toast = useToast();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  const profileForm = useFinForm<IUpdateUserProfileInput>({
    resolver: zodResolver(UpdateUserProfileInputSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      suffix: "",
    },
  });

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (!profile) {
    return null;
  }

  return (
    <>
      <Container>
        <div className="flex items-center justify-between mb-4">
          <ScrollableHeader id="profile-information">
            Profile Information
          </ScrollableHeader>
          <IconButton
            clicked={
              isEditingProfile
                ? handleCancelEdit
                : () => setIsEditingProfile(true)
            }
            aria-label={isEditingProfile ? "Cancel editing" : "Edit profile"}>
            {isEditingProfile ? (
              <svg
                className="size-5"
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
                className="size-5"
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
                  {profile.suffix || <span className="text-text-muted">-</span>}
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
              <p className="text-text mt-1">{formatDate(profile.createdAt)}</p>
            </div>

            {/* Last Updated (read-only) */}
            <div>
              <Label>Last Updated</Label>
              <p className="text-text mt-1">{formatDate(profile.updatedAt)}</p>
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

      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onConfirm={handleDiscardChanges}
        onCancel={() => setShowUnsavedDialog(false)}
      />
    </>
  );
}
