import { formatCurrency } from "@/features/currency/utils/currencyhelpers";
import {
  IBudgetAlert,
  IBudgetComparison,
} from "@/features/shared/validation/schemas";
import { Container } from "@/features/ui/container/container";
import { cn } from "@/features/util/cn";
import { BudgetAlerts } from "./budget-alerts";
import { BudgetStatusBadge, getStatusColor } from "./budget-status-badge";

type IBudgetSummaryContainerProps = {
  totals: IBudgetComparison["totals"];
  currency: IBudgetComparison["budget"]["currency"];
  alerts: IBudgetAlert[];
};

export function BudgetSummaryContainer({
  currency,
  totals,
  alerts,
}: IBudgetSummaryContainerProps) {
  const { totalExpected, totalActual, totalDifference } = totals;

  const totalExpectedFloat = parseFloat(totalExpected);
  const totalActualFloat = parseFloat(totalActual);
  const totalPercentage =
    totalExpectedFloat > 0 ? (totalActualFloat / totalExpectedFloat) * 100 : 0;

  return (
    <Container>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold">Budget Summary</h3>
        <BudgetStatusBadge percentage={totalPercentage} />
      </div>
      <div className="grid grid-cols-3 gap-4 mb-3">
        <div>
          <div className="text-xs text-text-muted mb-0.5">Expected</div>
          <div className="text-lg font-semibold">
            {formatCurrency(totalExpected, currency)}
          </div>
        </div>
        <div>
          <div className="text-xs text-text-muted mb-0.5">Actual</div>
          <div
            className={cn(
              "text-lg font-semibold",
              getStatusColor(totalPercentage)
            )}>
            {formatCurrency(totalActual, currency)}
          </div>
        </div>
        <div>
          <div className="text-xs text-text-muted mb-0.5">Difference</div>
          <div
            className={cn(
              "text-lg font-semibold",
              getStatusColor(totalPercentage)
            )}>
            {formatCurrency(totalDifference, currency)}
          </div>
        </div>
      </div>
      <div className="w-full bg-surface-hover rounded-full h-2 overflow-hidden">
        <div
          className={cn(
            "h-full transition-all",
            totalPercentage < 80
              ? "bg-success"
              : totalPercentage >= 80 && totalPercentage <= 100
                ? "bg-warning"
                : "bg-danger"
          )}
          style={{ width: `${Math.min(totalPercentage, 100)}%` }}
        />
      </div>

      {alerts.length > 0 && (
        <BudgetAlerts
          alerts={alerts}
          className="mt-4"
        />
      )}
    </Container>
  );
}
