import { Currency } from "@/features/currency/components/currency";
import type { ITransaction } from "@/features/shared/validation/schemas";
import {
  getTransactionDisplayAmount,
  transactionHasRefundNetting,
} from "@/features/transaction/utils/get-transaction-display-amount";
import { cn } from "@/features/util/cn";

type ITransactionAmountProps = {
  transaction: ITransaction;
  searchQuery?: string;
  className?: string;
};

export function TransactionAmount({
  transaction,
  searchQuery,
  className,
}: ITransactionAmountProps) {
  const displayAmount = getTransactionDisplayAmount(transaction);
  const showGrossStrike = transactionHasRefundNetting(transaction);

  return (
    <span className={cn("inline-flex items-baseline gap-1.5", className)}>
      {showGrossStrike ? (
        <Currency
          amount={transaction.amount}
          type={transaction.type}
          currency={transaction.currency}
          searchQuery={searchQuery}
          className="text-sm font-normal text-text-muted line-through"
        />
      ) : null}
      <Currency
        amount={displayAmount}
        type={transaction.type}
        transferDirection={transaction.transferDirection ?? null}
        currency={transaction.currency}
        searchQuery={searchQuery}
        className="font-semibold"
      />
    </span>
  );
}
