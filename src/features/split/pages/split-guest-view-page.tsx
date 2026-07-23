import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { joinSplitGroupByInviteToken } from "@/features/split/api/client";
import { SplitBalanceSummary } from "@/features/split/components/split-balance-summary";
import { SplitGroupActivityTabs } from "@/features/split/components/split-group-activity-tabs";
import { SplitGuestExpenseDialog } from "@/features/split/components/split-guest-expense-dialog";
import { SplitGuestInviteError } from "@/features/split/components/split-guest-invite-error";
import { RecordSettlementDialog } from "@/features/split/components/record-settlement-dialog";
import type { ISplitExpense } from "@/features/split/offline/split-offline-optimistic";
import type { ISplitSettlement } from "@/features/split/utils/group-split-settlements-by-date";
import { isInvalidShareLinkError } from "@/features/split/utils/is-invalid-share-link-error";
import { apiGet } from "@/features/shared/api/client";
import { useFinQuery } from "@/features/shared/query/core";
import { useResponsive } from "@/features/shared/hooks/useResponsive";
import { Button } from "@/features/ui/button/button";
import { Container } from "@/features/ui/container/container";
import { Skeleton } from "@/features/ui/skeleton";
import { IconButton } from "@/features/ui/button/icon-button";
import { authClient } from "@/lib/auth-client";
import { HiPlus } from "react-icons/hi2";

export function SplitGuestViewPage() {
  const { token } = useParams({ from: "/splits/join/$token/view" });
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [settleOpen, setSettleOpen] = useState(false);
  const [recoveringAsUser, setRecoveringAsUser] = useState(false);
  const { data, isLoading, isError, error } = useFinQuery({
    queryKey: ["split-guest", token],
    queryFn: () =>
      apiGet<{
        group: {
          name: string;
          defaultCurrency: string;
          guestCanAdd: boolean;
          guestCanSettle: boolean;
        };
        member: { id: string; displayName: string };
        members: Array<{ id: string; displayName: string }>;
        expenses: ISplitExpense[];
        settlements: ISplitSettlement[];
        balances: Parameters<typeof SplitBalanceSummary>[0]["balances"];
      }>(`/splits/guest/${token}`),
    retry: false,
  });

  useEffect(() => {
    if (!isError || recoveringAsUser) {
      return;
    }

    let cancelled = false;

    async function tryJoinAsLoggedInUser() {
      const session = await authClient.getSession();
      if (cancelled || !session.data) {
        return;
      }

      setRecoveringAsUser(true);
      try {
        const result = await joinSplitGroupByInviteToken(token);
        if (cancelled) {
          return;
        }
        await navigate({
          to: "/splits/$groupId",
          params: { groupId: result.groupId },
        });
      } catch {
        if (!cancelled) {
          setRecoveringAsUser(false);
        }
      }
    }

    void tryJoinAsLoggedInUser();
    return () => {
      cancelled = true;
    };
  }, [isError, navigate, recoveringAsUser, token]);

  if (isLoading || recoveringAsUser) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Skeleton className="h-10 w-48 mb-6" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    if (isInvalidShareLinkError(error)) {
      return (
        <SplitGuestInviteError
          token={token}
          title="Invite link unavailable"
          description="This share link is invalid, was reset, or no longer works. Ask the group admin for a new invite."
          showJoinAgain={false}
        />
      );
    }

    return (
      <SplitGuestInviteError
        token={token}
        title="Unable to load group"
        description="Your guest session may have expired, or this browser is not signed into the group. Join again with your name to continue."
      />
    );
  }

  const canAddExpenses = data.group.guestCanAdd;
  const canSettle = data.group.guestCanSettle;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-4 py-3">
        <p className="text-xs text-text-muted">Financely · {data.group.name}</p>
        <p className="text-sm text-text">Hi, {data.member.displayName}</p>
      </header>
      <main className="p-4 max-w-lg mx-auto space-y-6 pb-28">
        <SplitBalanceSummary balances={data.balances} />
        {canSettle ? (
          <Button variant="secondary" clicked={() => setSettleOpen(true)} className="w-full">
            Settle up
          </Button>
        ) : null}
        {canAddExpenses && !isMobile ? (
          <Button
            variant="primary"
            clicked={() => setExpenseDialogOpen(true)}
            className="w-full">
            Add expense
          </Button>
        ) : null}
        <SplitGroupActivityTabs
          expenses={data.expenses}
          settlements={data.settlements}
          groupCurrency={data.group.defaultCurrency}
          viewer={{
            userId: "",
            memberId: data.member.id,
            role: "guest",
          }}
        />
        <Container className="text-center text-sm">
          <p className="text-text-muted mb-2">
            Create a Financely account to sync shares to your transactions.
          </p>
          <Link
            to="/register"
            search={{ redirect: `/splits/join/${token}` }}
            className="text-primary font-medium">
            Sign up free
          </Link>
        </Container>
      </main>

      {canAddExpenses && isMobile ? (
        <IconButton
          variant="primary"
          ariaLabel="Add expense"
          clicked={() => setExpenseDialogOpen(true)}
          className="fixed bottom-6 right-4 z-40 size-14 rounded-full shadow-lg">
          <HiPlus className="size-7" />
        </IconButton>
      ) : null}

      {canAddExpenses ? (
        <SplitGuestExpenseDialog
          open={expenseDialogOpen}
          onOpenChange={setExpenseDialogOpen}
          token={token}
          groupCurrency={data.group.defaultCurrency}
          expenses={data.expenses}
          members={data.members}
          currentMemberId={data.member.id}
        />
      ) : null}

      {canSettle ? (
        <RecordSettlementDialog
          open={settleOpen}
          onOpenChange={setSettleOpen}
          guestToken={token}
          members={data.members}
          currency={data.group.defaultCurrency}
          currentMemberId={data.member.id}
        />
      ) : null}
    </div>
  );
}
