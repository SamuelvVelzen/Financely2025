import { Checkbox } from "@/features/ui/checkbox/checkbox";
import type { ITransaction } from "@/features/shared/validation/schemas";

type ITransactionRowSelectCheckboxProps = {
  transaction: ITransaction;
  checked: boolean;
  onToggle: (transactionId: string) => void;
};

export function TransactionRowSelectCheckbox({
  transaction,
  checked,
  onToggle,
}: ITransactionRowSelectCheckboxProps) {
  return (
    <div
      className="flex items-center justify-center"
      role="presentation"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}>
      <Checkbox
        checked={checked}
        onChange={() => onToggle(transaction.id)}
        aria-label={`Select ${transaction.name}`}
      />
    </div>
  );
}