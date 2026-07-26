import type {
  IBudgetAlert,
  IBudgetComparison,
} from "@/features/shared/validation/schemas";
import { Badge } from "@/features/ui/badge/badge";
import {
  getNetRemainingFromTotals,
  getNetRemainingStatus,
} from "@/features/budget/utils/budget-summary-helpers";
import { BudgetAlerts } from "./budget-alerts";
import { getStatusColor } from "./budget-status";
import { SummaryMetric } from "./summary-metric";

type IBudgetSummaryContainerProps = {
  totals: IBudgetComparison["totals"];
  currency: IBudgetComparison["budget"]["currency"];
  alerts: IBudgetAlert[];
  periodViewLabel?: string | null;
  onAddAlertTagToBudget?: (tagId: string) => void;
};

export function BudgetSummaryContainer({
  currency,
  totals,
  alerts,
  periodViewLabel,
  onAddAlertTagToBudget,
}: IBudgetSummaryContainerProps) {
  const incomeExpected = parseFloat(totals.income.expected);
  const incomeActual = parseFloat(totals.income.actual);
  const expenseExpected = parseFloat(totals.expenses.expected);
  const expenseActual = parseFloat(totals.expenses.actual);

  const { actualRemaining, expectedRemaining } =
    getNetRemainingFromTotals(totals);

  const incomePercentage =
    incomeExpected > 0 ? (incomeActual / incomeExpected) * 100 : 0;
  const expensePercentage =
    expenseExpected > 0 ? (expenseActual / expenseExpected) * 100 : 0;

  const netStatus = getNetRemainingStatus(actualRemaining, expectedRemaining);

  return (
    <>
      <section className="border-b border-border pb-4 mb-4">
        <div className="mb-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-semibold">Budget Summary</h3>
            <Badge variant={netStatus.variant}>{netStatus.label}</Badge>
          </div>
          {periodViewLabel && (
            <p className="text-xs text-text-muted mt-1">{periodViewLabel}</p>
          )}
        </div>

        <div className="hidden sm:grid sm:grid-cols-3 sm:items-end sm:gap-8 w-full">
          <SummaryMetric
            label="Income"
            actual={totals.income.actual}
            expected={totals.income.expected}
            currency={currency}
            valueClassName={getStatusColor(incomePercentage, "INCOME")}
            align="left"
          />
          <SummaryMetric
            label="Remaining"
            actual={actualRemaining.toString()}
            expected={expectedRemaining.toString()}
            currency={currency}
            valueClassName={netStatus.colorClass}
            align="center"
            size="xl"
          />
          <SummaryMetric
            label="Expenses"
            actual={totals.expenses.actual}
            expected={totals.expenses.expected}
            currency={currency}
            valueClassName={getStatusColor(expensePercentage, "EXPENSE")}
            align="right"
          />
        </div>

        <div className="sm:hidden space-y-4 w-full">
          <SummaryMetric
            label="Remaining"
            actual={actualRemaining.toString()}
            expected={expectedRemaining.toString()}
            currency={currency}
            valueClassName={netStatus.colorClass}
            align="center"
            size="xl"
          />
          <div className="grid grid-cols-2 gap-4">
            <SummaryMetric
              label="Income"
              actual={totals.income.actual}
              expected={totals.income.expected}
              currency={currency}
              valueClassName={getStatusColor(incomePercentage, "INCOME")}
              align="left"
            />
            <SummaryMetric
              label="Expenses"
              actual={totals.expenses.actual}
              expected={totals.expenses.expected}
              currency={currency}
              valueClassName={getStatusColor(expensePercentage, "EXPENSE")}
              align="right"
            />
          </div>
        </div>
      </section>

      {alerts.length > 0 && onAddAlertTagToBudget && (
        <BudgetAlerts
          alerts={alerts}
          currency={currency}
          onAddToBudget={onAddAlertTagToBudget}
          className="mb-4"
        />
      )}
    </>
  );
}
