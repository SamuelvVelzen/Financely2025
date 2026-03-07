import { Currency } from "@/features/currency/components/currency";
import { FREQUENCY_LABELS } from "@/features/subscription/config/frequencies";
import type { ISubscriptionCandidate } from "@/features/shared/validation/schemas";
import { Badge } from "@/features/ui/badge/badge";
import { Button } from "@/features/ui/button/button";
import { cn } from "@/features/util/cn";
import { HiCheck, HiXMark } from "react-icons/hi2";

type ISubscriptionCandidateCardProps = {
  candidate: ISubscriptionCandidate;
  onConfirm: (candidate: ISubscriptionCandidate) => void;
  onDismiss: (candidate: ISubscriptionCandidate) => void;
  isConfirming?: boolean;
  isDismissing?: boolean;
};

export function SubscriptionCandidateCard({
  candidate,
  onConfirm,
  onDismiss,
  isConfirming,
  isDismissing,
}: ISubscriptionCandidateCardProps) {
  return (
    <div className="border border-border rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="font-medium text-text truncate">
            {candidate.displayName}
          </span>
          <Badge
            variant={
              candidate.type === "EXPENSE" ? "danger" : "success"
            }>
            {candidate.type === "EXPENSE" ? "Expense" : "Income"}
          </Badge>
        </div>
        <Currency
          amount={`${candidate.type === "EXPENSE" ? "-" : ""}${candidate.averageAmount}`}
          currency={candidate.currency}
          className={cn(
            "font-semibold text-lg",
            candidate.type === "EXPENSE"
              ? "text-danger"
              : "text-success",
          )}
        />
      </div>

      <div className="flex items-center gap-4 text-sm text-text-muted">
        <span>
          {FREQUENCY_LABELS[candidate.frequency]}
        </span>
        <span>
          {candidate.occurrences} occurrences
        </span>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Button
          variant="primary"
          size="sm"
          clicked={() => onConfirm(candidate)}
          loading={isConfirming}
          disabled={isDismissing}>
          <HiCheck className="size-4 mr-1" />
          Confirm
        </Button>
        <Button
          variant="default"
          size="sm"
          clicked={() => onDismiss(candidate)}
          loading={isDismissing}
          disabled={isConfirming}>
          <HiXMark className="size-4 mr-1" />
          Not a subscription
        </Button>
      </div>
    </div>
  );
}
