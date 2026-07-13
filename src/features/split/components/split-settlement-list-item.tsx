import { formatCurrency } from "@/features/currency/utils/currencyhelpers";
import type { ISplitSettlement } from "@/features/split/utils/group-split-settlements-by-date";
import { ListItem } from "@/features/ui/list/list-item";

export function SplitSettlementListItem({
  settlement,
  currency,
}: {
  settlement: ISplitSettlement;
  currency: string;
}) {
  return (
    <ListItem className="py-3">
      <div className="flex w-full min-w-0 justify-between gap-4">
        <div className="min-w-0">
          <p className="font-medium text-text truncate">
            {settlement.fromDisplayName} paid {settlement.toDisplayName}
          </p>
          {settlement.note ? (
            <p className="text-sm text-text-muted truncate">{settlement.note}</p>
          ) : null}
        </div>
        <p className="shrink-0 font-medium text-text">
          {formatCurrency(settlement.amount, currency)}
        </p>
      </div>
    </ListItem>
  );
}
