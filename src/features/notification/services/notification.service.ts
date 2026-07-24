import {
  CreateNotificationInputSchema,
  NotificationSchema,
  NotificationsQuerySchema,
  NotificationsResponseSchema,
  type ICreateNotificationInput,
  type INotificationsQuery,
  type INotificationsResponse,
  type INotification,
} from "@/features/shared/validation/schemas";
import { prisma } from "@/features/util/prisma";
import type { IWorkspaceId } from "@/features/workspace/workspace-id";

/**
 * Notification Service (workspace-scoped in-app notifications)
 */
export class NotificationService {
  static async createNotification(
    userId: string,
    workspaceId: IWorkspaceId,
    input: ICreateNotificationInput,
  ): Promise<INotification> {
    const validated = CreateNotificationInputSchema.parse(input);

    const notification = await prisma.notification.create({
      data: {
        userId,
        workspaceId,
        title: validated.title,
        content: validated.content,
        type: validated.type,
        actions: validated.actions
          ? JSON.stringify(validated.actions)
          : null,
        relatedId: validated.relatedId ?? null,
        relatedType: validated.relatedType ?? null,
      },
    });

    return this.parseNotification(notification);
  }

  static async listNotifications(
    userId: string,
    workspaceId: IWorkspaceId,
    query: INotificationsQuery,
  ): Promise<INotificationsResponse> {
    const validated = NotificationsQuerySchema.parse(query);

    const where: Record<string, unknown> = {
      userId,
      workspaceId,
    };

    if (validated.read !== undefined) {
      where.read = validated.read;
    }

    if (validated.type) {
      where.type = validated.type;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        skip: (validated.page - 1) * validated.limit,
        take: validated.limit,
      }),
      prisma.notification.count({ where }),
    ]);

    return NotificationsResponseSchema.parse({
      data: notifications.map((item) => this.parseNotification(item)),
      page: validated.page,
      limit: validated.limit,
      total,
      hasNext: validated.page * validated.limit < total,
    });
  }

  static async getNotificationById(
    userId: string,
    workspaceId: IWorkspaceId,
    notificationId: string,
  ): Promise<INotification | null> {
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
        workspaceId,
      },
    });

    if (!notification) {
      return null;
    }

    return this.parseNotification(notification);
  }

  static async markAsRead(
    userId: string,
    workspaceId: IWorkspaceId,
    notificationId: string,
  ): Promise<INotification> {
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
        workspaceId,
      },
    });

    if (!notification) {
      throw new Error("Notification not found");
    }

    const updated = await prisma.notification.update({
      where: {
        id: notificationId,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return this.parseNotification(updated);
  }

  static async markAllAsRead(
    userId: string,
    workspaceId: IWorkspaceId,
  ): Promise<void> {
    await prisma.notification.updateMany({
      where: {
        userId,
        workspaceId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
  }

  static async deleteNotification(
    userId: string,
    workspaceId: IWorkspaceId,
    notificationId: string,
  ): Promise<void> {
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
        workspaceId,
      },
    });

    if (!notification) {
      throw new Error("Notification not found");
    }

    await prisma.notification.delete({
      where: {
        id: notificationId,
      },
    });
  }

  static async getUnreadCount(
    userId: string,
    workspaceId: IWorkspaceId,
  ): Promise<number> {
    return prisma.notification.count({
      where: {
        userId,
        workspaceId,
        read: false,
      },
    });
  }

  private static parseNotification(notification: {
    id: string;
    userId: string;
    title: string;
    content: string;
    type: string;
    actions: string | null;
    read: boolean;
    readAt: Date | null;
    relatedId: string | null;
    relatedType: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): INotification {
    let parsedActions = null;
    if (notification.actions) {
      try {
        parsedActions = JSON.parse(notification.actions);
      } catch {
        parsedActions = null;
      }
    }

    return NotificationSchema.parse({
      id: notification.id,
      userId: notification.userId,
      title: notification.title,
      content: notification.content,
      type: notification.type,
      actions: parsedActions,
      read: notification.read,
      readAt: notification.readAt ? notification.readAt.toISOString() : null,
      relatedId: notification.relatedId,
      relatedType: notification.relatedType,
      createdAt: notification.createdAt.toISOString(),
      updatedAt: notification.updatedAt.toISOString(),
    });
  }
}
