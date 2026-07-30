import type { ITransaction } from "@/features/shared/validation/schemas";
import { Dropdown } from "@/features/ui/dropdown/dropdown";
import { DropdownItem } from "@/features/ui/dropdown/dropdown-item";
import { HiArrowUturnLeft, HiPencil, HiTrash } from "react-icons/hi2";

type ITransactionRowActionsProps = {
  transaction: ITransaction;
  onEdit?: (transaction: ITransaction) => void;
  onDelete?: (transaction: ITransaction) => void;
  onAllocateRefund?: (transaction: ITransaction) => void;
};

export function TransactionRowActions({
  transaction,
  onEdit,
  onDelete,
  onAllocateRefund,
}: ITransactionRowActionsProps) {
  const canAllocate =
    transaction.type === "INCOME" && !!onAllocateRefund;

  if (!onEdit && !onDelete && !canAllocate) {
    return null;
  }

  return (
    <div
      className="flex items-center ml-1"
      role="presentation"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}>
      <Dropdown size="sm">
        {onEdit && (
          <DropdownItem
            icon={<HiPencil className="size-4" />}
            text="Edit"
            clicked={() => onEdit(transaction)}
          />
        )}
        {canAllocate && (
          <DropdownItem
            icon={<HiArrowUturnLeft className="size-4" />}
            text="Allocate refund"
            clicked={() => onAllocateRefund(transaction)}
          />
        )}
        {onDelete && (
          <DropdownItem
            icon={<HiTrash className="size-4" />}
            text="Delete"
            clicked={() => onDelete(transaction)}
            className="text-danger hover:bg-danger/10"
          />
        )}
      </Dropdown>
    </div>
  );
}
