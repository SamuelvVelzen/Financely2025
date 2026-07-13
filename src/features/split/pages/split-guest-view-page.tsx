import { useParams } from "@tanstack/react-router";
import { SplitBalanceSummary } from "@/features/split/components/split-balance-summary";
import { SplitExpenseList } from "@/features/split/components/split-expense-list";
import type { ISplitExpense } from "@/features/split/offline/split-offline-optimistic";
import { apiGet } from "@/features/shared/api/client";
import { useFinQuery } from "@/features/shared/query/core";
import { Container } from "@/features/ui/container/container";
import { Skeleton } from "@/features/ui/skeleton";
import { Link } from "@tanstack/react-router";

export function SplitGuestViewPage() {
  const { token } = useParams({ from: "/splits/join/$token/view" });
  const { data, isLoading } = useFinQuery({
    queryKey: ["split-guest", token],
    queryFn: () =>
      apiGet<{
        group: { name: string; defaultCurrency: string };
        member: { displayName: string };
        expenses: ISplitExpense[];
        balances: Parameters<typeof SplitBalanceSummary>[0]["balances"];
      }>(`/splits/guest/${token}`),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Skeleton className="h-10 w-48 mb-6" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background p-4">
        <p className="text-text-muted">Unable to load group</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-4 py-3">
        <p className="text-xs text-text-muted">Financely · {data.group.name}</p>
        <p className="text-sm text-text">Hi, {data.member.displayName}</p>
      </header>
      <main className="p-4 max-w-lg mx-auto space-y-6">
        <SplitBalanceSummary balances={data.balances} />
        <div>
          <h2 className="font-semibold text-text mb-3">Expenses</h2>
          <SplitExpenseList
            expenses={data.expenses}
            groupCurrency={data.group.defaultCurrency}
          />
        </div>
        <Container className="text-center text-sm">
          <p className="text-text-muted mb-2">
            Create a Financely account to sync shares to your transactions.
          </p>
          <Link to="/register" search={{ redirect: "" }} className="text-primary font-medium">
            Sign up free
          </Link>
        </Container>
      </main>
    </div>
  );
}
