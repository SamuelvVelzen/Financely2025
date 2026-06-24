import { formatCurrency } from "@/features/currency/utils/currencyhelpers";
import type {
  IBudgetAlert,
  IBudgetComparison,
} from "@/features/shared/validation/schemas";
import { Badge } from "@/features/ui/badge/badge";
import { cn } from "@/features/util/cn";
import {
  getNetRemainingFromTotals,
  getNetRemainingStatus,
} from "@/features/budget/utils/budget-summary-helpers";
import { BudgetAlerts } from "./budget-alerts";
import { getStatusColor } from "./budget-status";

type IBudgetSummaryContainerProps = {
  totals: IBudgetComparison["totals"];
  currency: IBudgetComparison["budget"]["currency"];
  alerts: IBudgetAlert[];
  periodViewLabel?: string | null;
};

type ISummaryMetricProps = {
  label: string;
  actual: string;
  expected: string;
  currency: IBudgetComparison["budget"]["currency"];
  valueClassName?: string;
  align?: "left" | "center" | "right";
  size?: "md" | "lg" | "xl";
};

function SummaryMetric({
  label,
  actual,
  expected,
  currency,
  valueClassName,
  align = "left",
  size = "md",
}: ISummaryMetricProps) {
  return (
    <div
      className={cn(
        align === "center" && "text-center",
        align === "right" && "text-right",
      )}>
      <div className="text-xs text-text-muted mb-0.5">{label}</div>
      <div
        className={cn(
          "font-semibold",
          size === "xl"
            ? "text-3xl"
            : size === "lg"
              ? "text-2xl"
              : "text-xl",
          valueClassName,
        )}>
        {formatCurrency(actual, currency)}
      </div>
      <div className="text-xs text-text-muted">
        of {formatCurrency(expected, currency)}
      </div>
    </div>
  );
}

export function BudgetSummaryContainer({
  currency,
  totals,
  alerts,
  periodViewLabel,
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

      {alerts.length > 0 && (
        <BudgetAlerts
          alerts={alerts}
          className="mb-4"
        />
      )}
    </>
  );
}
