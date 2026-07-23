import { useEffect, useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { joinSplitGroupByInviteToken } from "@/features/split/api/client";
import { GuestJoinForm } from "@/features/split/components/guest-join-form";
import { SplitGuestInviteError } from "@/features/split/components/split-guest-invite-error";
import { isInvalidShareLinkError } from "@/features/split/utils/is-invalid-share-link-error";
import { apiGet } from "@/features/shared/api/client";
import { Button } from "@/features/ui/button/button";
import { Container } from "@/features/ui/container/container";
import { Skeleton } from "@/features/ui/skeleton";
import { Title } from "@/features/ui/typography/title";
import { authClient } from "@/lib/auth-client";

type IJoinPhase = "resolving" | "form" | "invalid" | "auth_error";

export function SplitGuestJoinPage() {
  const { token } = useParams({ from: "/splits/join/$token/" });
  const navigate = useNavigate();
  const [phase, setPhase] = useState<IJoinPhase>("resolving");
  const [authError, setAuthError] = useState<string | null>(null);
  const [resolveKey, setResolveKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function resolveInvite() {
      setPhase("resolving");
      setAuthError(null);

      const session = await authClient.getSession();
      if (cancelled) {
        return;
      }

      if (session.data) {
        try {
          const result = await joinSplitGroupByInviteToken(token);
          if (cancelled) {
            return;
          }
          await navigate({
            to: "/splits/$groupId",
            params: { groupId: result.groupId },
          });
        } catch (error) {
          if (cancelled) {
            return;
          }
          if (isInvalidShareLinkError(error)) {
            setPhase("invalid");
            return;
          }
          setAuthError(
            error instanceof Error
              ? error.message
              : "Could not join this group with your account.",
          );
          setPhase("auth_error");
        }
        return;
      }

      try {
        await apiGet(`/splits/guest/${token}`);
        if (cancelled) {
          return;
        }
        await navigate({
          to: "/splits/join/$token/view",
          params: { token },
        });
      } catch (error) {
        if (cancelled) {
          return;
        }
        if (isInvalidShareLinkError(error)) {
          setPhase("invalid");
          return;
        }
        setPhase("form");
      }
    }

    void resolveInvite();
    return () => {
      cancelled = true;
    };
  }, [navigate, resolveKey, token]);

  if (phase === "resolving") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Container className="w-full max-w-md space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-24 w-full" />
        </Container>
      </div>
    );
  }

  if (phase === "invalid") {
    return (
      <SplitGuestInviteError
        token={token}
        title="Invite link unavailable"
        description="This share link is invalid or no longer works. Ask the group admin for a new invite."
        showJoinAgain={false}
      />
    );
  }

  if (phase === "auth_error") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Container className="w-full max-w-md space-y-4">
          <p className="text-sm text-text-muted">Financely Splits</p>
          <Title>Could not join group</Title>
          <p className="text-text-muted">
            {authError ?? "Something went wrong while joining with your account."}
          </p>
          <Button
            variant="primary"
            className="w-full"
            clicked={() => setResolveKey((key) => key + 1)}>
            Try again
          </Button>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Container className="w-full max-w-md">
        <p className="text-sm text-text-muted mb-2">Financely Splits</p>
        <Title className="mb-6">Join group</Title>
        <GuestJoinForm token={token} />
      </Container>
    </div>
  );
}
