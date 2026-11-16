import type { ITransferDirection } from "@/features/shared/validation/enums";
import type { ITransactionType } from "@/features/shared/validation/schemas";
import { Button } from "@/features/ui/button/button";
import { Dropdown } from "@/features/ui/dropdown/dropdown";
import { DropdownDivider } from "@/features/ui/dropdown/dropdown-divider";
import { DropdownItem } from "@/features/ui/dropdown/dropdown-item";
import { cn } from "@/features/util/cn";
import {
  HiArrowsRightLeft,
  HiArrowTrendingDown,
  HiArrowTrendingUp,
  HiTrash,
  HiXMark,
} from "react-icons/hi2";

type ITransactionBulkActionsBarProps = {
  selectedCount: number;
  visibleCount: number;
  allVisibleSelected: boolean;
  onClear: () => void;
  onSelectAllVisible: () => void;
  onDelete: () => void;
  onChangeType: (
    type: ITransactionType,
    transferDirection?: ITransferDirection | null,
  ) => void;
  pending?: boolean;
  className?: string;
};

export function TransactionBulkActionsBar({
  selectedCount,
  visibleCount,
  allVisibleSelected,
  onClear,
  onSelectAllVisible,
  onDelete,
  onChangeType,
  pending = false,
  className,
}: ITransactionBulkActionsBarProps) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface-secondary px-3 py-2 text-sm",
        className,
      )}
    >
      <span className="font-medium">{selectedCount} selected</span>
      {!allVisibleSelected && visibleCount > selectedCount ? (
        <Button
          size="sm"
          variant="default"
          disabled={pending}
          clicked={onSelectAllVisible}
        >
          Select all {visibleCount} loaded
        </Button>
      ) : null}
      <Button
        size="sm"
        variant="default"
        disabled={pending}
        clicked={onClear}
        ariaLabel="Clear selection"
      >
        <HiXMark className="size-4" />
      </Button>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        <Dropdown
          size="sm"
          dropdownSelector={{
            content: "Change type",
            variant: "default",
          }}
        >
          <DropdownItem
            icon={<HiArrowTrendingDown className="size-4" />}
            text="Mark as expense"
            clicked={() => onChangeType("EXPENSE")}
          />
          <DropdownItem
            icon={<HiArrowTrendingUp className="size-4" />}
            text="Mark as income"
            clicked={() => onChangeType("INCOME")}
          />
          <DropdownDivider />
          <DropdownItem
            icon={<HiArrowsRightLeft className="size-4" />}
            text="Mark as transfer (out)"
            clicked={() => onChangeType("TRANSFER", "OUT")}
          />
          <DropdownItem
            icon={<HiArrowsRightLeft className="size-4" />}
            text="Mark as transfer (in)"
            clicked={() => onChangeType("TRANSFER", "IN")}
          />
        </Dropdown>
        <Button
          size="sm"
          variant="danger"
          disabled={pending}
          clicked={onDelete}
        >
          <HiTrash className="size-4" />
          Delete
        </Button>
      </div>
    </div>
  );
}
