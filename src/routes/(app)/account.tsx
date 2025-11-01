import Container from "@/components/container/container";
import Title from "@/components/typography/title";
import { useMe } from "@/lib/query/hooks/user";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/account")({
  component: AccountPage,
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
