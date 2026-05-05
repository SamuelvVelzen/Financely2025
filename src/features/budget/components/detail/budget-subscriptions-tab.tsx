import { Currency } from "@/features/currency/components/currency";
import type {
  IBudget,
  ISubscription,
  ISubscriptionFrequency,
} from "@/features/shared/validation/schemas";
import { SubscriptionDetectionDialog } from "@/features/subscription/components/subscription-detection-dialog";
import { FREQUENCY_LABELS } from "@/features/subscription/config/frequencies";
import { useSubscriptions } from "@/features/subscription/hooks/useSubscriptions";
import { Badge } from "@/features/ui/badge/badge";
import { Button } from "@/features/ui/button/button";
import { Container } from "@/features/ui/container/container";
import { EmptyPage } from "@/features/ui/container/empty-container";
import { List } from "@/features/ui/list/list";
import { ListItem } from "@/features/ui/list/list-item";
import { Loading } from "@/features/ui/loading";
import { DateFormatHelpers } from "@/features/util/date/date-format.helpers";
import { useMemo, useState } from "react";
import {
  HiArrowPath,
  HiChevronDown,
  HiChevronUp,
  HiMagnifyingGlass,
} from "react-icons/hi2";

type IBudgetSubscriptionsTabProps = {
  budget: IBudget;
};

export function BudgetSubscriptionsTab({
  budget,
}: IBudgetSubscriptionsTabProps) {
  const { data: subscriptionsData, isLoading } = useSubscriptions({
    active: true,
  });

  const [isDetectDialogOpen, setIsDetectDialogOpen] = useState(false);

  const budgetStart = new Date(budget.startDate);
  const budgetEnd = new Date(budget.endDate);

  const relevantSubscriptions = useMemo(() => {
    if (!subscriptionsData?.data) return [];

    return subscriptionsData.data
      .filter((sub) => sub.currency === budget.currency)
      .map((sub) => {
        const txInPeriod = (sub.transactions ?? []).filter((tx) => {
          const txDate = new Date(tx.transactionDate);
          return txDate >= budgetStart && txDate <= budgetEnd;
        });
        return { ...sub, transactionsInPeriod: txInPeriod };
      });
  }, [subscriptionsData, budget.currency, budget.startDate, budget.endDate]);

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

type ISubscriptionBudgetItemProps = {
  subscription: ISubscription;
  transactionsInPeriod: Array<{
    id: string;
    name: string;
    amount: string;
    currency: string;
    transactionDate: string;
    type: "EXPENSE" | "INCOME";
  }>;
};

function SubscriptionBudgetItem({
  subscription,
  transactionsInPeriod,
}: ISubscriptionBudgetItemProps) {
  const [expanded, setExpanded] = useState(false);

  const totalInPeriod = transactionsInPeriod.reduce(
    (sum, tx) => sum + parseFloat(tx.amount),
    0,
  );

  return (
    <ListItem className="flex-col items-stretch gap-2">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <HiArrowPath className="size-4 text-info shrink-0" />
          <span className="font-medium text-text truncate">
            {subscription.name}
          </span>
          <Badge
            variant={
              subscription.type === "EXPENSE" ? "danger" : "success"
            }>
            {subscription.type === "EXPENSE" ? "Expense" : "Income"}
          </Badge>
          <Badge>
            {
              FREQUENCY_LABELS[
              subscription.frequency as ISubscriptionFrequency
              ]
            }
          </Badge>
        </div>

        <Currency
          amount={totalInPeriod.toFixed(2)}
          currency={subscription.currency}
          type={subscription.type}
        />
      </div>

      <div className="flex items-center gap-4 text-sm text-text-muted">
        <span>
          {transactionsInPeriod.length} transaction
          {transactionsInPeriod.length !== 1 ? "s" : ""} in period
        </span>
        <span>
          ~{subscription.amount}/
          {subscription.frequency === "yearly"
            ? "year"
            : subscription.frequency === "monthly"
              ? "month"
              : subscription.frequency}
        </span>
      </div>

      {transactionsInPeriod.length > 0 && (
        <>
          <button
            type="button"
            className="flex items-center gap-1 text-xs text-text-muted hover:text-text transition-colors self-start"
            onClick={() => setExpanded(!expanded)}>
            {expanded ? (
              <HiChevronUp className="size-3" />
            ) : (
              <HiChevronDown className="size-3" />
            )}
            {expanded ? "Hide" : "Show"} transactions
          </button>

          {expanded && (
            <div className="ml-6 space-y-1">
              {transactionsInPeriod.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between text-sm text-text-muted py-1">
                  <span className="truncate flex-1">{tx.name}</span>
                  <div className="flex items-center gap-3 shrink-0">
                    <span>
                      {DateFormatHelpers.formatIsoStringToString(
                        tx.transactionDate,
                        "DateOnly",
                      )}
                    </span>
                    <Currency
                      amount={tx.amount}
                      type={tx.type}
                      currency={tx.currency}
                      className="text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </ListItem>
  );
}
