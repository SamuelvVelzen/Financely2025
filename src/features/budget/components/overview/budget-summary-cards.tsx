"use client";

import {
  formatRemaining,
  getStatusColor,
} from "@/features/budget/utils/budget-overview-helpers";
import { formatCurrency } from "@/features/currency/utils/currencyhelpers";
import { IBudgetsOverviewResponse } from "@/features/shared/validation/schemas";
import { Loading } from "@/features/ui/loading";
import { cn } from "@/features/util/cn";
import { HiExclamationTriangle } from "react-icons/hi2";

type IBudgetSummaryCardsProps = {
  overviewData?: IBudgetsOverviewResponse;
  isLoading: boolean;
  error: Error | null;
};

export function BudgetSummaryCards({
  overviewData,
  isLoading,
  error,
}: IBudgetSummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-4 border border-border rounded-2xl bg-surface">
            <Loading text="" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-border rounded-2xl bg-surface text-text-muted text-sm">
        Unable to load overview metrics
      </div>
    );
  }

  if (!overviewData) {
    return null;
  }

  const { overallHealth, riskSummary, timeContext, context, topSpenders } =
    overviewData;

  const borderClasses =
    "divide-y md:divide-y-0 md:divide-x divide-border [&>:not(:last-child)]:mb-3 [&>:not(:last-child)]:pb-3 md:[&>:not(:last-child)]:mr-3 md:[&>:not(:last-child)]:pr-3 md:[&>:not(:last-child)]:mb-0 md:[&>:not(:last-child)]:pb-0";

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3", borderClasses)}>
      {/* Card 1: Overall Budget Health */}
      <div>
        <div className="text-xs font-medium text-text-muted uppercase tracking-wide mb-4">
          Overall Budget Health
        </div>
        {overallHealth.activeCount > 0 ? (
          <>
            <div className="mb-4">
              <div className="text-3xl font-bold mb-1">
                {formatRemaining(
                  parseFloat(overallHealth.remaining),
                  overallHealth.currency
                )}
              </div>
              <div className="text-sm text-text-muted">
                of{" "}
                {formatCurrency(
                  overallHealth.totalExpected,
                  overallHealth.currency
                )}
              </div>
            </div>
            <div className="mb-4">
              <div className="w-full bg-surface-hover rounded-full h-2.5 overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all",
                    overallHealth.percentage < 80
                      ? "bg-success"
                      : overallHealth.percentage >= 80 &&
                          overallHealth.percentage <= 100
                        ? "bg-warning"
                        : "bg-danger"
                  )}
                  style={{
                    width: `${Math.min(overallHealth.percentage, 100)}%`,
                  }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">Budgeted</span>
                <span className="font-semibold text-text">
                  {formatCurrency(
                    overallHealth.totalExpected,
                    overallHealth.currency
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">Spent</span>
                <span
                  className={cn(
                    "font-semibold",
                    getStatusColor(overallHealth.percentage)
                  )}>
                  {formatCurrency(
                    overallHealth.totalActual,
                    overallHealth.currency
                  )}
                </span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <div className="text-xs text-text-muted">
                {overallHealth.activeCount} active
                {overallHealth.activeCount === 1 ? " budget" : " budgets"}
              </div>
            </div>
          </>
        ) : (
          <div className="text-text-muted text-sm py-4">No active budgets</div>
        )}
      </div>

      {/* Card 2: Budgets at Risk */}
      <div>
        <div className="text-xs font-medium text-text-muted uppercase tracking-wide mb-4">
          Budgets at Risk
        </div>
        {riskSummary.totalActive > 0 ? (
          <>
            <div className="mb-4">
              {riskSummary.nearingLimit === 0 &&
              riskSummary.overBudget === 0 ? (
                <div className="text-3xl font-bold text-success mb-1">
                  All on track
                </div>
              ) : (
                <div className="text-3xl font-bold mb-1">
                  {riskSummary.nearingLimit > 0 && (
                    <span className="text-warning">
                      {riskSummary.nearingLimit}
                    </span>
                  )}
                  {riskSummary.nearingLimit > 0 &&
                    riskSummary.overBudget > 0 && (
                      <span className="text-text-muted"> / </span>
                    )}
                  {riskSummary.overBudget > 0 && (
                    <span className="text-danger">
                      {riskSummary.overBudget}
                    </span>
                  )}
                </div>
              )}
              {(riskSummary.nearingLimit > 0 || riskSummary.overBudget > 0) && (
                <div className="text-sm text-text-muted">
                  {riskSummary.nearingLimit > 0 && riskSummary.overBudget > 0
                    ? "nearing limit / over budget"
                    : riskSummary.nearingLimit > 0
                      ? "nearing limit"
                      : "over budget"}
                </div>
              )}
            </div>
            {timeContext.daysRemaining !== null && (
              <div className="mb-3">
                <div className="text-sm text-text-muted">
                  {timeContext.daysRemaining} days remaining
                </div>
              </div>
            )}
            {timeContext.spendingPace === "faster" && (
              <div className="flex items-center gap-2 text-sm text-warning">
                <HiExclamationTriangle className="size-4" />
                <span>Spending faster than usual</span>
              </div>
            )}
            {timeContext.spendingPace === "slower" && (
              <div className="text-sm text-success">
                Spending slower than expected
              </div>
            )}
          </>
        ) : (
          <div className="text-text-muted text-sm py-4">No active budgets</div>
        )}
      </div>

      {/* Card 3: Budget Overview */}
      <div>
        <div className="text-xs font-medium text-text-muted uppercase tracking-wide mb-4">
          Budget Overview
        </div>
        <div className="mb-4">
          <div className="text-3xl font-bold mb-1">{context.totalBudgets}</div>
          <div className="text-sm text-text-muted">
            total {context.totalBudgets === 1 ? "budget" : "budgets"}
          </div>
        </div>
        {topSpenders && topSpenders.length > 0 ? (
          <div className="pt-4 border-t border-border">
            <div className="text-xs font-medium text-text-muted uppercase tracking-wide mb-3">
              Top spend
            </div>
            <div className="space-y-2.5">
              {topSpenders.map((spender, index) => (
                <div
                  key={spender.tagId}
                  className="flex items-center gap-2">
                  {spender.tagColor && (
                    <div
                      className="size-3 rounded-full shrink-0"
                      style={{
                        backgroundColor: spender.tagColor,
                      }}
                    />
                  )}
                  <span className="font-semibold text-sm flex-1 min-w-0 truncate">
                    {spender.tagName}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-semibold text-sm">
                      {formatCurrency(spender.amount, overallHealth.currency)}
                    </span>
                    <span className="text-xs text-text-muted">
                      ({spender.percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="pt-4 border-t border-border">
            <div className="text-xs text-text-muted">No spending data yet</div>
          </div>
        )}
      </div>
    </div>
  );
}
