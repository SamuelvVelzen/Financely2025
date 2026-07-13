import { Currency } from "@/features/currency/components/currency";
import type { ISplitSettlement } from "@/features/split/utils/group-split-settlements-by-date";
import { Dropdown } from "@/features/ui/dropdown/dropdown";
import { DropdownItem } from "@/features/ui/dropdown/dropdown-item";
import { ListItem } from "@/features/ui/list/list-item";
import { HiPencil, HiTrash } from "react-icons/hi2";

export function SplitSettlementListItem({
  settlement,
  currency,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  settlement: ISplitSettlement;
  currency: string;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (settlement: ISplitSettlement) => void;
  onDelete: (settlement: ISplitSettlement) => void;
}) {
  const showActions = canEdit || canDelete;

  return (
    <ListItem
      className="py-3"
      clicked={canEdit ? () => onEdit(settlement) : undefined}>
      <div className="flex w-full min-w-0 justify-between gap-4">
        <div className="min-w-0">
          <p className="font-medium text-text truncate">
            {settlement.fromDisplayName} paid {settlement.toDisplayName}
          </p>
          {settlement.note ? (
            <p className="text-sm text-text-muted truncate">{settlement.note}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Currency
            amount={settlement.amount}
            currency={currency}
            className="font-medium"
          />
          {showActions ? (
            <div
              role="presentation"
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}>
              <Dropdown size="sm">
                {canEdit ? (
                  <DropdownItem
                    icon={<HiPencil className="size-4" />}
                    text="Edit"
                    clicked={() => onEdit(settlement)}
                  />
                ) : null}
                {canDelete ? (
                  <DropdownItem
                    icon={<HiTrash className="size-4" />}
                    text="Delete"
                    clicked={() => onDelete(settlement)}
                    className="text-danger hover:bg-danger/10"
                  />
                ) : null}
              </Dropdown>
            </div>
          ) : null}
        </div>
      </div>
    </ListItem>
  );
}
