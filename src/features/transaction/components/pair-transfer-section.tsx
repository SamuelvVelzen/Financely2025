import { Currency } from "@/features/currency/components/currency";
import type { ITransaction } from "@/features/shared/validation/schemas";
import {
  usePairTransfer,
  useTransferSuggestions,
} from "@/features/transaction/hooks/useTransfers";
import { Button } from "@/features/ui/button/button";
import { Loading } from "@/features/ui/loading";
import { useToast } from "@/features/ui/toast";
import { DateFormatHelpers } from "@/features/util/date/date-format.helpers";
import { useState } from "react";
import { HiArrowsRightLeft } from "react-icons/hi2";

type IPairTransferSectionProps = {
  transaction: ITransaction;
  onPaired?: () => void;
};

export function PairTransferSection({
  transaction,
  onPaired,
}: IPairTransferSectionProps) {
  const toast = useToast();
  const pairTransfer = usePairTransfer();
  const [selectedOtherId, setSelectedOtherId] = useState<string | null>(null);

  const canSuggest =
    !transaction.transferGroupId &&
    (transaction.type === "EXPENSE" ||
      transaction.type === "INCOME" ||
      transaction.type === "TRANSFER");

  const { data, isLoading, isError } = useTransferSuggestions(
    transaction.id,
    canSuggest,
  );

  if (transaction.transferGroupId) {
    return (
      <div className="rounded-md border border-border bg-surface-secondary/50 px-3 py-2 text-sm text-text-muted">
        This transaction is already linked to its transfer counterpart.
      </div>
    );
  }

  if (!canSuggest) {
    return null;
  }

  const suggestions = data?.suggestions ?? [];

  const handlePair = (otherId: string) => {
    setSelectedOtherId(otherId);
    pairTransfer.mutate(
      {
        transactionId: transaction.id,
        input: { otherTransactionId: otherId },
      },
      {
        onSuccess: () => {
          toast.success("Transactions linked as a transfer");
          onPaired?.();
        },
        onError: () => {
          toast.error("Could not link transfer");
        },
        onSettled: () => setSelectedOtherId(null),
      },
    );
  };

  return (
    <div className="space-y-2 rounded-md border border-border p-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <HiArrowsRightLeft className="size-4 shrink-0" />
        Link transfer counterpart
      </div>
      <p className="text-xs text-text-muted">
        Match this row with the opposite leg (same amount and currency, within
        ±3 days).
      </p>
      {isLoading ? (
        <Loading text="Finding matches" />
      ) : isError ? (
        <p className="text-sm text-danger">Could not load suggestions.</p>
      ) : suggestions.length === 0 ? (
        <p className="text-sm text-text-muted">
          No matching transactions found.
        </p>
      ) : (
        <ul className="space-y-2">
          {suggestions.map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-2 py-1.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{s.name}</p>
                <p className="text-xs text-text-muted">
                  <Currency amount={s.amount} currency={s.currency} />
                  {" · "}
                  {DateFormatHelpers.formatIsoStringToString(
                    s.transactionDate,
                    "DateOnly",
                  )}
                </p>
              </div>
              <Button
                size="sm"
                variant="default"
                loading={pairTransfer.isPending && selectedOtherId === s.id}
                clicked={() => handlePair(s.id)}
              >
                Link
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
