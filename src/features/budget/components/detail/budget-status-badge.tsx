import { Tooltip } from "@/features/ui/tooltip/tooltip";
import { cn } from "@/features/util/cn";
import { HiChevronDown, HiChevronUp } from "react-icons/hi2";
import { resolveBudgetStatus, type IBudgetStatusParams } from "./budget-status";

export function BudgetStatusIcon(props: IBudgetStatusParams) {
  const status = resolveBudgetStatus(props);

  if (!status.icon) {
    return <span className="size-5 shrink-0" aria-hidden />;
  }

  const Icon = status.icon === "up" ? HiChevronUp : HiChevronDown;

  return (
    <Tooltip content={status.label}>
      <span
        className="inline-flex shrink-0"
        role="img"
        aria-label={status.label}>
        <Icon className={cn("size-5", status.textColor)} />
      </span>
    </Tooltip>
  );
}
