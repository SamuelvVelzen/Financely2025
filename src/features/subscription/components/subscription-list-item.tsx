import { Currency } from "@/features/currency/components/currency";
import type {
  ISubscription,
  ISubscriptionFrequency,
} from "@/features/shared/validation/schemas";
import { FREQUENCY_LABELS } from "@/features/subscription/config/frequencies";
import { Badge } from "@/features/ui/badge/badge";
import { Dropdown } from "@/features/ui/dropdown/dropdown";
import { DropdownItem } from "@/features/ui/dropdown/dropdown-item";
import { ListItem } from "@/features/ui/list/list-item";
import { DateFormatHelpers } from "@/features/util/date/date-format.helpers";
import { useState } from "react";
import {
  HiChevronDown,
  HiChevronUp,
  HiPause,
  HiPlay,
  HiTrash,
} from "react-icons/hi2";

type ISubscriptionListItemProps = {
  subscription: ISubscription;
  onToggleActive: (subscription: ISubscription) => void;
  onDelete: (subscription: ISubscription) => void;
};

export function SubscriptionListItem({
  subscription,
  onToggleActive,
  onDelete,
}: ISubscriptionListItemProps) {
  const [expanded, setExpanded] = useState(false);
  const transactions = subscription.transactions ?? [];

  return (
    <ListItem className="flex-col items-stretch gap-2">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0 flex-1">
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
          {!subscription.active && (
            <Badge variant="warning">Paused</Badge>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Currency
            amount={subscription.amount}
            type={subscription.type}
            currency={subscription.currency}
            className="font-semibold text-lg"


          />

          <div className="flex items-center ml-1 gap-1 opacity-20 group-hover:opacity-100 focus-within:opacity-100 motion-safe:transition-opacity">
            <Dropdown size="sm">
              <DropdownItem
                icon={
                  subscription.active ? (
                    <HiPause className="size-4" />
                  ) : (
                    <HiPlay className="size-4" />
                  )
                }
                text={subscription.active ? "Pause" : "Resume"}
                clicked={() => onToggleActive(subscription)}
              />
              <DropdownItem
                icon={<HiTrash className="size-4" />}
                text="Delete"
                clicked={() => onDelete(subscription)}
                className="text-danger hover:bg-danger/10"
              />
            </Dropdown>
          </div>
        </div>
      </div>

      {transactions.length > 0 && (
        <button
          type="button"
          className="flex items-center gap-1 text-sm text-text-muted hover:text-text transition-colors self-start"
          onClick={() => setExpanded(!expanded)}>
          {expanded ? (
            <HiChevronUp className="size-4" />
          ) : (
            <HiChevronDown className="size-4" />
          )}
          {transactions.length} transaction
          {transactions.length !== 1 ? "s" : ""}
        </button>
      )}

      {expanded && transactions.length > 0 && (
        <div className="ml-4 mt-1 space-y-1">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between text-sm text-text-muted py-1">
              <span className="truncate">{tx.name}</span>
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
    </ListItem>
  );
}
