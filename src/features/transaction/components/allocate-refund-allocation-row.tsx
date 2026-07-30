import { DecimalInput } from "@/features/ui/input/decimal-input";
import { IconButton } from "@/features/ui/button/icon-button";
import { ListItem } from "@/features/ui/list/list-item";
import { HiTrash } from "react-icons/hi2";

type IAllocateRefundAllocationRowProps = {
  name: string;
  amount: string;
  currency: string;
  maxAmount: number;
  onAmountChange: (amount: string) => void;
  onRemove: () => void;
  onOpen?: () => void;
};

export function AllocateRefundAllocationRow({
  name,
  amount,
  currency,
  maxAmount,
  onAmountChange,
  onRemove,
  onOpen,
}: IAllocateRefundAllocationRowProps) {
  const roundedMax = Math.max(0, Math.round(maxAmount * 100) / 100);

  return (
    <ListItem className="gap-2">
      {onOpen ? (
        <button
          type="button"
          className="min-w-0 flex-1 text-left"
          onClick={onOpen}>
          <div className="truncate font-medium hover:underline">{name}</div>
          <div className="text-xs text-text-muted">Max {roundedMax}</div>
        </button>
      ) : (
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">{name}</div>
          <div className="text-xs text-text-muted">Max {roundedMax}</div>
        </div>
      )}
      <div className="w-28">
        <DecimalInput
          value={amount}
          currency={currency}
          max={roundedMax}
          onChange={(value) =>
            onAmountChange(value == null ? "" : String(value))
          }
          aria-label={`Allocation amount for ${name}`}
        />
      </div>
      <IconButton
        ariaLabel={`Remove allocation for ${name}`}
        variant="danger"
        className="bg-transparent text-danger hover:bg-danger/10 hover:text-danger"
        clicked={onRemove}
        icon={<HiTrash className="size-4" />}
      />
    </ListItem>
  );
}
