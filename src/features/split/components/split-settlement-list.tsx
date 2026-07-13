import { SplitSettlementListItem } from "@/features/split/components/split-settlement-list-item";
import {
  groupSplitSettlementsByDate,
  type ISplitSettlement,
} from "@/features/split/utils/group-split-settlements-by-date";
import { EmptyPage } from "@/features/ui/container/empty-container";
import { List } from "@/features/ui/list/list";
import { cn } from "@/features/util/cn";
import { HiBanknotes } from "react-icons/hi2";

export function SplitSettlementList({
  settlements,
  currency,
}: {
  settlements: ISplitSettlement[];
  currency: string;
}) {
  if (settlements.length === 0) {
    return (
      <EmptyPage
        icon={HiBanknotes}
        emptyText="No settlements recorded yet."
      />
    );
  }

  const dateGroups = groupSplitSettlementsByDate(settlements);

  return (
    <div className="overflow-hidden">
      {dateGroups.map((group, groupIndex) => (
        <div
          key={group.date}
          className={cn(groupIndex > 0 && "mt-6")}>
          <div className="px-4 py-2 mb-2">
            <h3 className="text-sm font-semibold text-text-muted">
              {group.dateHeader}
            </h3>
          </div>
          <List data={group.settlements}>
            {(settlement) => (
              <SplitSettlementListItem
                key={settlement.id}
                settlement={settlement}
                currency={currency}
              />
            )}
          </List>
        </div>
      ))}
    </div>
  );
}
