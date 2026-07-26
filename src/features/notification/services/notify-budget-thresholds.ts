import { BudgetService } from "@/features/budget/services/budget.service";
import { formatCurrency } from "@/features/currency/utils/currencyhelpers";
import { prisma } from "@/features/util/prisma";
import type { IWorkspaceId } from "@/features/workspace/workspace-id";
import { budgetThresholdTitle } from "../utils/budget-threshold-notification-titles";
import { NOTIFICATION_RELATED_TYPE } from "../utils/notification-related-type";
import { resolveBudgetThresholdLevel } from "../utils/resolve-budget-threshold-level";
import { NotificationFactory } from "./notification.factory";

async function hasBudgetThresholdNotification(params: {
  userId: string;
  workspaceId: IWorkspaceId;
  budgetId: string;
  level: "near" | "over";
  periodStart: Date;
  periodEnd: Date;
}): Promise<boolean> {
  const existing = await prisma.notification.findFirst({
    where: {
      userId: params.userId,
      workspaceId: params.workspaceId,
      relatedType: NOTIFICATION_RELATED_TYPE.budget,
      relatedId: params.budgetId,
      title: budgetThresholdTitle(params.level),
      createdAt: {
        gte: params.periodStart,
        lte: params.periodEnd,
      },
    },
    select: { id: true },
  });

  return existing !== null;
}

/**
 * After a transaction write, notify when an active budget's expense spend
 * crosses near (≥80%) or over (>100%) — once per budget per period per level.
 */
export async function notifyBudgetThresholdsIfNeeded(
  userId: string,
  workspaceId: IWorkspaceId,
): Promise<void> {
  const now = new Date();

  const activeBudgets = await prisma.budget.findMany({
    where: {
      userId,
      workspaceId,
      startDate: { lte: now },
      endDate: { gte: now },
    },
    select: {
      id: true,
      name: true,
      currency: true,
      startDate: true,
      endDate: true,
    },
  });

  if (activeBudgets.length === 0) {
    return;
  }

  for (const budget of activeBudgets) {
    try {
      const comparison = await BudgetService.getBudgetComparison(
        userId,
        workspaceId,
        budget.id,
      );

      const expected = parseFloat(comparison.totals.expenses.expected);
      const actual = parseFloat(comparison.totals.expenses.actual);

      if (!(expected > 0)) {
        continue;
      }

      const percentage = (actual / expected) * 100;
      const level = resolveBudgetThresholdLevel(percentage);

      if (!level) {
        continue;
      }

      // Jumping straight past 100%: only notify over (skip near).
      const alreadyNotified = await hasBudgetThresholdNotification({
        userId,
        workspaceId,
        budgetId: budget.id,
        level,
        periodStart: budget.startDate,
        periodEnd: budget.endDate,
      });

      if (alreadyNotified) {
        continue;
      }

      const roundedPct = Math.round(percentage);
      const spentLabel = formatCurrency(actual.toFixed(2), budget.currency);
      const limitLabel = formatCurrency(expected.toFixed(2), budget.currency);

      if (level === "over") {
        await NotificationFactory.createBudgetOverspendNotification(
          userId,
          workspaceId,
          {
            budgetId: budget.id,
            budgetName: budget.name,
            percentage: roundedPct,
            spentLabel,
            limitLabel,
          },
        );
      } else {
        await NotificationFactory.createBudgetNearLimitNotification(
          userId,
          workspaceId,
          {
            budgetId: budget.id,
            budgetName: budget.name,
            percentage: roundedPct,
            spentLabel,
            limitLabel,
          },
        );
      }
    } catch {
      // Keep checking other budgets; never fail the transaction write path.
    }
  }
}
