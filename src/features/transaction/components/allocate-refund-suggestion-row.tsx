import type { IRefundAllocationSuggestion } from "@/features/shared/validation/schemas";
import { Button } from "@/features/ui/button/button";
import { IconButton } from "@/features/ui/button/icon-button";
import { ListItem } from "@/features/ui/list/list-item";
import { DateFormatHelpers } from "@/features/util/date/date-format.helpers";
import { HiArrowTopRightOnSquare, HiPlus } from "react-icons/hi2";

type IAllocateRefundSuggestionRowProps = {
  suggestion: IRefundAllocationSuggestion;
  disabled?: boolean;
  onAdd: () => void;
  onOpen?: () => void;
};

export function AllocateRefundSuggestionRow({
  suggestion,
  disabled = false,
  onAdd,
  onOpen,
}: IAllocateRefundSuggestionRowProps) {
  return (
    <ListItem className="gap-2">
      {onOpen ? (
        <button
          type="button"
          className="min-w-0 flex-1 text-left"
          onClick={onOpen}>
          <div className="truncate font-medium hover:underline">
            {suggestion.name}
          </div>
          <div className="text-xs text-text-muted">
            {DateFormatHelpers.formatIsoStringToString(
              suggestion.transactionDate,
              "DateOnly",
            )}{" "}
            · net {suggestion.expenseNet} {suggestion.currency}
          </div>
        </button>
      ) : (
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">{suggestion.name}</div>
          <div className="text-xs text-text-muted">
            {DateFormatHelpers.formatIsoStringToString(
              suggestion.transactionDate,
              "DateOnly",
            )}{" "}
            · net {suggestion.expenseNet} {suggestion.currency}
          </div>
        </div>
      )}
      {onOpen ? (
        <IconButton
          ariaLabel={`Open ${suggestion.name}`}
          tooltip="Open transaction"
          size="sm"
          clicked={onOpen}
          icon={<HiArrowTopRightOnSquare className="size-4" />}
        />
      ) : null}
      <Button
        size="sm"
        variant="default"
        clicked={onAdd}
        disabled={disabled}>
        <HiPlus className="size-4" />
        Add
      </Button>
    </ListItem>
  );
}
