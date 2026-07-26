import { formatCurrency } from "@/features/currency/utils/currencyhelpers";
import type {
  IBudgetAlert,
  IBudgetComparison,
} from "@/features/shared/validation/schemas";
import { TagInline } from "@/features/tag/components/tag-inline";
import { Alert } from "@/features/ui/alert/alert";
import { Badge } from "@/features/ui/badge/badge";
import { Button } from "@/features/ui/button/button";
import { cn } from "@/features/util/cn";
import { type IPropsWithClassName } from "@/features/util/type-helpers/props";
import { useState } from "react";
import { HiChevronDown } from "react-icons/hi2";

type IBudgetAlertsProps = {
  alerts: IBudgetAlert[];
  currency: IBudgetComparison["budget"]["currency"];
  onAddToBudget: (tagId: string) => void;
} & IPropsWithClassName;

export function BudgetAlerts({
  alerts,
  currency,
  onAddToBudget,
  className = "",
}: IBudgetAlertsProps) {
  const [expanded, setExpanded] = useState(false);

  if (alerts.length === 0) {
    return null;
  }

  const totalAmount = alerts.reduce(
    (sum, alert) => sum + parseFloat(alert.totalAmount),
    0,
  );
  const tagCountLabel = `${alerts.length} tag${alerts.length !== 1 ? "s" : ""}`;
  const summaryTitle = `${tagCountLabel} · ${formatCurrency(totalAmount.toString(), currency)} not in this budget`;

  return (
    <div className={cn(className)}>
      <Alert
        variant="warning"
        title={summaryTitle}>
        <p>
          These tags have transactions that aren&apos;t budget lines, so they
          aren&apos;t included in the summary above.
        </p>

        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-2 flex items-center gap-1 text-sm font-medium text-warning hover:underline cursor-pointer"
          aria-expanded={expanded}>
          {expanded ? "Hide tags" : "Show tags"}
          <HiChevronDown
            className={cn(
              "size-4 transition-transform",
              expanded && "rotate-180",
            )}
          />
        </button>

        {expanded ? (
          <ul className="mt-3 divide-y divide-warning/20">
            {alerts.map((alert) => (
              <li
                key={alert.tagId}
                className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <TagInline
                    tag={{
                      name: alert.tagName,
                      color: alert.tagColor,
                      emoticon: alert.tagEmoticon,
                    }}
                    showColorDot
                    nameClassName="font-medium text-text"
                  />
                  <Badge>
                    {alert.transactionCount} transaction
                    {alert.transactionCount !== 1 ? "s" : ""}
                  </Badge>
                  <span className="text-sm font-medium text-text">
                    {formatCurrency(alert.totalAmount, currency)}
                  </span>
                </div>
                <Button
                  size="xs"
                  variant="warning"
                  buttonContent="Add to budget"
                  clicked={() => onAddToBudget(alert.tagId)}
                  className="shrink-0"
                />
              </li>
            ))}
          </ul>
        ) : null}
      </Alert>
    </div>
  );
}
