import type { INotificationAction } from "@/features/shared/validation/schemas";
import type { IWorkspaceId } from "@/features/workspace/workspace-id";
import { NOTIFICATION_RELATED_TYPE } from "../utils/notification-related-type";
import { NotificationService } from "./notification.service";

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
