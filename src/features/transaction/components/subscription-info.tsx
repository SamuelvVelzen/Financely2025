import { Currency } from "@/features/currency/components/currency";
import type { ISubscriptionFrequency } from "@/features/subscription/config/frequencies";
import { FREQUENCY_LABELS } from "@/features/subscription/config/frequencies";
import { useSubscription } from "@/features/subscription/hooks/useSubscriptions";
import { Badge } from "@/features/ui/badge/badge";
import { DateFormatHelpers } from "@/features/util/date/date-format.helpers";
import { useState } from "react";
import {
  HiArrowPath,
  HiChevronDown,
  HiChevronUp,
} from "react-icons/hi2";

type ISubscriptionInfoProps = {
  subscriptionId: string;
  subscriptionName: string;
  frequency: string;
  active: boolean;
  currentTransactionId: string;
};

export function SubscriptionInfo({
  subscriptionId,
  subscriptionName,
  frequency,
  active,
  currentTransactionId,
}: ISubscriptionInfoProps) {
  const [showTransactions, setShowTransactions] = useState(false);
  const { data: subscription } = useSubscription(subscriptionId);
  const transactions = subscription?.transactions ?? [];
  const otherTransactions = transactions.filter(
    (t) => t.id !== currentTransactionId,
  );

  return (
    <div className="border border-border rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HiArrowPath className="size-4 text-info" />
          <span className="text-sm font-medium text-text">
            {subscriptionName}
          </span>
          <Badge variant="info" className="text-xs">
            {FREQUENCY_LABELS[frequency as ISubscriptionFrequency] ??
              frequency}
          </Badge>
          {!active && (
            <Badge variant="warning" className="text-xs">
              Paused
            </Badge>
          )}
        </div>
      </div>

      {otherTransactions.length > 0 && (
        <>
          <button
            type="button"
            className="flex items-center gap-1 text-xs text-text-muted hover:text-text transition-colors"
            onClick={() => setShowTransactions(!showTransactions)}>
            {showTransactions ? (
              <HiChevronUp className="size-3" />
            ) : (
              <HiChevronDown className="size-3" />
            )}
            {otherTransactions.length} other transaction
            {otherTransactions.length !== 1 ? "s" : ""}
          </button>

          {showTransactions && (
            <div className="space-y-1 ml-2">
              {otherTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between text-xs text-text-muted py-0.5">
                  <span className="truncate flex-1">{tx.name}</span>
                  <div className="flex items-center gap-2 shrink-0">
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
                      className="text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
