import { Container } from "@/features/ui/container/container";
import { Title } from "@/features/ui/typography/title";
import { useMe } from "@/features/users/hooks/useUser";
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
  const { data: user, isLoading, error } = useMe();

  return (
    <>
      <Container className="mb-4">
        <Title>Account</Title>
        <p className="text-text-muted">
          Manage your account settings and preferences.
        </p>
      </Container>

      <Container>
        {isLoading && <p className="text-text-muted text-center">Loading...</p>}
        {error && (
          <p className="text-red-500 text-center">Error: {error.message}</p>
        )}
        {user && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-text-muted">
                Email
              </label>
              <p className="text-text">{user.email}</p>
            </div>
            {user.name && (
              <div>
                <label className="text-sm font-medium text-text-muted">
                  Name
                </label>
                <p className="text-text">{user.name}</p>
              </div>
            )}
          </div>
        )}
      </Container>
    </>
  );
}
