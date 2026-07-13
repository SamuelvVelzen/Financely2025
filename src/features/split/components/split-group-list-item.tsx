import type { ISplitGroupDialogTarget } from "@/features/split/components/add-or-edit-split-group-dialog-shared";
import { Currency } from "@/features/currency/components/currency";
import { Dropdown } from "@/features/ui/dropdown/dropdown";
import { DropdownItem } from "@/features/ui/dropdown/dropdown-item";
import { ListItem } from "@/features/ui/list/list-item";
import { cn } from "@/features/util/cn";
import { HiPencil, HiTrash } from "react-icons/hi2";

type ISplitGroupListItem = ISplitGroupDialogTarget & {
  memberCount: number;
  viewerNetAmount?: string;
};

export function SplitGroupListItem({
  group,
  canEdit,
  onView,
  onEdit,
  onDelete,
}: {
  group: ISplitGroupListItem;
  canEdit?: boolean;
  onView: (group: ISplitGroupListItem) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const net = group.viewerNetAmount
    ? parseFloat(group.viewerNetAmount)
    : 0;
  const hasBalance = Math.abs(net) > 0.005;

  return (
    <ListItem className="py-3" clicked={() => onView(group)}>
      <div className="flex w-full min-w-0 items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate text-text">{group.name}</p>
          <p className="text-sm text-text-muted mt-0.5">
            {group.memberCount} {group.memberCount === 1 ? "member" : "members"}{" "}
            · {group.expenseCount}{" "}
            {group.expenseCount === 1 ? "expense" : "expenses"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="text-right">
            {hasBalance ? (
              <p
                className={cn(
                  "font-semibold",
                  net < 0 ? "text-danger" : "text-success",
                )}>
                {net < 0 ? "You owe " : "Owed "}
                <Currency
                  amount={Math.abs(net).toFixed(2)}
                  currency={group.defaultCurrency}
                  className="font-semibold"
                />
              </p>
            ) : (
              <p className="text-sm text-text-muted">Settled up</p>
            )}
            <p className="text-xs text-text-muted mt-0.5">{group.defaultCurrency}</p>
          </div>
          {canEdit && onEdit ? (
            <div
              role="presentation"
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}>
              <Dropdown size="sm">
                <DropdownItem
                  icon={<HiPencil className="size-4" />}
                  text="Edit"
                  clicked={onEdit}
                />
                {onDelete ? (
                  <DropdownItem
                    icon={<HiTrash className="size-4" />}
                    text="Delete"
                    clicked={onDelete}
                    className="text-danger hover:bg-danger/10"
                  />
                ) : null}
              </Dropdown>
            </div>
          ) : onDelete ? (
            <div
              role="presentation"
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}>
              <Dropdown size="sm">
                <DropdownItem
                  icon={<HiTrash className="size-4" />}
                  text="Delete"
                  clicked={onDelete}
                  className="text-danger hover:bg-danger/10"
                />
              </Dropdown>
            </div>
          ) : null}
        </div>
      </div>
    </ListItem>
  );
}
