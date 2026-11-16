import type { IBudget } from "@/features/shared/validation/schemas";
import { SubscriptionBudgetItem } from "@/features/budget/components/detail/subscription-budget-item";
import { SubscriptionDetectionDialog } from "@/features/subscription/components/subscription-detection-dialog";
import { useSubscriptions } from "@/features/subscription/hooks/useSubscriptions";
import { Badge } from "@/features/ui/badge/badge";
import { Button } from "@/features/ui/button/button";
import { Container } from "@/features/ui/container/container";
import { EmptyPage } from "@/features/ui/container/empty-container";
import { List } from "@/features/ui/list/list";
import { Loading } from "@/features/ui/loading";
import { useMemo, useState } from "react";
import { HiArrowPath, HiMagnifyingGlass } from "react-icons/hi2";

type IBudgetSubscriptionsTabProps = {
  budget: IBudget;
  onTransactionClick?: (transactionId: string) => void;
};

export function BudgetSubscriptionsTab({
  budget,
  onTransactionClick,
}: IBudgetSubscriptionsTabProps) {
  const { data: subscriptionsData, isLoading } = useSubscriptions();

  const [isDetectDialogOpen, setIsDetectDialogOpen] = useState(false);

  const budgetStart = useMemo(
    () => new Date(budget.startDate),
    [budget.startDate],
  );
  const budgetEnd = useMemo(
    () => new Date(budget.endDate),
    [budget.endDate],
  );

  const relevantSubscriptions = useMemo(() => {
    if (!subscriptionsData?.data) return [];

    return subscriptionsData.data
      .map((sub) => {
        const txInPeriod = (sub.transactions ?? [])
          .filter((tx) => {
            const txDate = new Date(tx.transactionDate);
            return txDate >= budgetStart && txDate <= budgetEnd;
          })
          .filter(
            (tx): tx is typeof tx & { type: "EXPENSE" | "INCOME" } =>
              tx.type === "EXPENSE" || tx.type === "INCOME",
          );
        return { ...sub, transactionsInPeriod: txInPeriod };
      })
      .filter((sub) => sub.active || sub.transactionsInPeriod.length > 0);
  }, [subscriptionsData, budgetStart, budgetEnd]);

  if (isLoading) {
    return (
      <Container>
        <Loading text="Loading subscriptions" />
      </Container>
    );
  }

  return (
    <>
      {relevantSubscriptions.length > 0 ? (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-text">
                Subscriptions
              </h2>
              <Badge>{relevantSubscriptions.length}</Badge>
            </div>
            <Button
              variant="primary"
              size="sm"
              clicked={() => setIsDetectDialogOpen(true)}>
              <HiMagnifyingGlass className="size-4 mr-1.5" />
              Detect
            </Button>
          </div>

          <List
            data={relevantSubscriptions}
            getItemKey={(s) => s.id}>
            {(sub) => (
              <SubscriptionBudgetItem
                key={sub.id}
                subscription={sub}
                transactionsInPeriod={sub.transactionsInPeriod}
                onTransactionClick={onTransactionClick}
              />
            )}
          </List>
        </>
      ) : (
        <>
          <EmptyPage
            icon={HiArrowPath}
            emptyText="No subscriptions found for this budget period. Try detecting some."
            button={{
              buttonContent: "Detect Subscriptions",
              clicked: () => setIsDetectDialogOpen(true),
            }}
          />
        </>
      )}

      <SubscriptionDetectionDialog
        open={isDetectDialogOpen}
        onOpenChange={setIsDetectDialogOpen}
      />
    </>
  );
}
