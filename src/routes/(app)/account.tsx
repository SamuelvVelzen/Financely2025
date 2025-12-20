import { Container } from "@/features/ui/container/container";
import { Title } from "@/features/ui/typography/title";
import { ChangeEmail } from "@/features/users/components/change-email";
import { ChangePassword } from "@/features/users/components/change-password";
import { ConnectedAccounts } from "@/features/users/components/connected-accounts";
import { ProfileInformation } from "@/features/users/components/profile-information";
import { useMyProfile } from "@/features/users/hooks/useMyProfile";
import { createFileRoute } from "@tanstack/react-router";

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

function AccountPage() {
  const { data: profile, isLoading: profileLoading, error } = useMyProfile();

  const isLoading = profileLoading;

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
          <ProfileInformation />
          <ConnectedAccounts />
          <ChangeEmail />
          <ChangePassword />
        </>
      )}
    </>
  );
}
