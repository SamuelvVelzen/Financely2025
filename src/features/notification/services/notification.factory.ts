import type { INotificationAction } from "@/features/shared/validation/schemas";
import type { IWorkspaceId } from "@/features/workspace/workspace-id";
import {
  BUDGET_NEAR_LIMIT_TITLE,
  BUDGET_OVER_LIMIT_TITLE,
} from "../utils/budget-threshold-notification-titles";
import { NOTIFICATION_RELATED_TYPE } from "../utils/notification-related-type";
import { NotificationService } from "./notification.service";

type IBudgetThresholdNotificationParams = {
  budgetId: string;
  budgetName: string;
  percentage: number;
  spentLabel: string;
  limitLabel: string;
};

/**
 * Notification Factory
 * Creates workspace-scoped notifications with relatedType intent (UI owns CTAs).
 */
export class NotificationFactory {
  static async createSubscriptionFoundNotification(
    userId: string,
    workspaceId: IWorkspaceId,
    count: number,
  ): Promise<void> {
    await NotificationService.createNotification(userId, workspaceId, {
      title: "Subscriptions Found",
      content: `We found ${count} potential subscription${count !== 1 ? "s" : ""} in your transactions.`,
      type: "INFO",
      relatedType: NOTIFICATION_RELATED_TYPE.subscription,
    });
  }

  static async createBudgetNearLimitNotification(
    userId: string,
    workspaceId: IWorkspaceId,
    params: IBudgetThresholdNotificationParams,
  ): Promise<void> {
    await NotificationService.createNotification(userId, workspaceId, {
      title: BUDGET_NEAR_LIMIT_TITLE,
      content: `"${params.budgetName}" is at ${params.percentage}% of its expense budget (${params.spentLabel} of ${params.limitLabel}).`,
      type: "WARNING",
      relatedId: params.budgetId,
      relatedType: NOTIFICATION_RELATED_TYPE.budget,
    });
  }

  static async createBudgetOverspendNotification(
    userId: string,
    workspaceId: IWorkspaceId,
    params: IBudgetThresholdNotificationParams,
  ): Promise<void> {
    await NotificationService.createNotification(userId, workspaceId, {
      title: BUDGET_OVER_LIMIT_TITLE,
      content: `"${params.budgetName}" is over budget at ${params.percentage}% (${params.spentLabel} of ${params.limitLabel}).`,
      type: "ERROR",
      relatedId: params.budgetId,
      relatedType: NOTIFICATION_RELATED_TYPE.budget,
    });
  }

  static async createExpenseAlertNotification(
    userId: string,
    workspaceId: IWorkspaceId,
    currentAmount: number,
    previousAmount: number,
    currency: string = "USD",
  ): Promise<void> {
    const percentage = Math.round(
      ((currentAmount - previousAmount) / previousAmount) * 100,
    );

    await NotificationService.createNotification(userId, workspaceId, {
      title: "High Monthly Expenses",
      content: `Your expenses this month (${currency} ${currentAmount.toFixed(2)}) are ${percentage}% higher than last month (${currency} ${previousAmount.toFixed(2)}).`,
      type: "WARNING",
      relatedType: NOTIFICATION_RELATED_TYPE.transactions,
    });
  }

  static async createTransactionImportNotification(
    userId: string,
    workspaceId: IWorkspaceId,
    successCount: number,
    failureCount: number,
    importId?: string,
  ): Promise<void> {
    let content = `Successfully imported ${successCount} transaction${successCount !== 1 ? "s" : ""}.`;
    if (failureCount > 0) {
      content += ` ${failureCount} transaction${failureCount !== 1 ? "s" : ""} failed to import.`;
    }

    await NotificationService.createNotification(userId, workspaceId, {
      title: "Import Complete",
      content,
      type: failureCount > 0 ? "WARNING" : "SUCCESS",
      relatedId: importId,
      relatedType: NOTIFICATION_RELATED_TYPE.import,
    });
  }

  static async createSystemNotification(
    userId: string,
    workspaceId: IWorkspaceId,
    title: string,
    content: string,
    type: "INFO" | "SUCCESS" | "WARNING" | "ERROR" = "INFO",
    relatedType?: string,
    /** @deprecated Prefer relatedType — kept for rare custom CTAs */
    actions?: INotificationAction[],
  ): Promise<void> {
    await NotificationService.createNotification(userId, workspaceId, {
      title,
      content,
      type,
      relatedType,
      actions,
    });
  }
}
