import { SplitSettlementListItem } from "@/features/split/components/split-settlement-list-item";
import {
  canDeleteSplitSettlement,
  canEditSplitSettlement,
} from "@/features/split/utils/can-edit-split-settlement";
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
  viewer,
  onEdit,
  onDelete,
}: {
  settlements: ISplitSettlement[];
  currency: string;
  viewer?: { userId: string; memberId: string; role: string };
  onEdit?: (settlement: ISplitSettlement) => void;
  onDelete?: (settlement: ISplitSettlement) => void;
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
            {(settlement) => {
              const canEdit =
                Boolean(onEdit) &&
                viewer != null &&
                canEditSplitSettlement(settlement, viewer);
              const canDelete =
                Boolean(onDelete) &&
                viewer != null &&
                canDeleteSplitSettlement(settlement, viewer);

              return (
                <SplitSettlementListItem
                  key={settlement.id}
                  settlement={settlement}
                  currency={currency}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  onEdit={onEdit ?? (() => {})}
                  onDelete={onDelete ?? (() => {})}
                />
              );
            }}
          </List>
        </div>
      ))}
    </div>
  );
}
