import { Container } from "@/features/ui/container/container";
import { SkeletonText, SkeletonTitle } from "@/features/ui/skeleton";
import { Title } from "@/features/ui/typography/title";
import { ChangeEmail } from "@/features/users/components/change-email";
import { ChangePassword } from "@/features/users/components/change-password";
import { ConnectedAccounts } from "@/features/users/components/connected-accounts";
import { ProfileInformation } from "@/features/users/components/profile-information";
import { useConnectedAccounts } from "@/features/users/hooks/useConnectedAccounts";
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
  const { isLoading: accountsLoading } = useConnectedAccounts();

  const isLoading = profileLoading || accountsLoading;

  return (
    <>
      <Container className="mb-4">
        <Title>Account</Title>
        <p className="text-text-muted">
          Manage your account settings and preferences.
        </p>
      </Container>

      {error && (
        <Container>
          <div className="p-4 bg-danger/10 border border-danger rounded-lg">
            <p className="text-danger text-sm">{error.message}</p>
          </div>
        </Container>
      )}

      {isLoading ? (
        <Container>
          <div className="space-y-4">
            <SkeletonTitle />

            <SkeletonText
              lines={12}
              alineas={3}
            />
          </div>
        </Container>
      ) : (
        profile && (
          <>
            <ProfileInformation />
            <ConnectedAccounts />
            <ChangeEmail />
            <ChangePassword />
          </>
        )
      )}
    </>
  );
}
