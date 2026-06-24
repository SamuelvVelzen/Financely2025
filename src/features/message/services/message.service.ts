import {
  CreateMessageInputSchema,
  MessageSchema,
  MessagesQuerySchema,
  MessagesResponseSchema,
  type ICreateMessageInput,
  type IMessagesQuery,
  type IMessagesResponse,
  type IMessage,
} from "@/features/shared/validation/schemas";
import { prisma } from "@/features/util/prisma";
import type { IWorkspaceId } from "@/features/workspace/workspace-id";

/**
 * Message Service (workspace-scoped in-app messages)
 */
export class MessageService {
  static async createMessage(
    userId: string,
    workspaceId: IWorkspaceId,
    input: ICreateMessageInput,
  ): Promise<IMessage> {
    const validated = CreateMessageInputSchema.parse(input);

    const message = await prisma.message.create({
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

    return this.parseMessage(message);
  }

  static async listMessages(
    userId: string,
    workspaceId: IWorkspaceId,
    query: IMessagesQuery,
  ): Promise<IMessagesResponse> {
    const validated = MessagesQuerySchema.parse(query);

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

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        skip: (validated.page - 1) * validated.limit,
        take: validated.limit,
      }),
      prisma.message.count({ where }),
    ]);

    return MessagesResponseSchema.parse({
      data: messages.map((msg) => this.parseMessage(msg)),
      page: validated.page,
      limit: validated.limit,
      total,
      hasNext: validated.page * validated.limit < total,
    });
  }

  static async getMessageById(
    userId: string,
    workspaceId: IWorkspaceId,
    messageId: string,
  ): Promise<IMessage | null> {
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        userId,
        workspaceId,
      },
    });

    if (!message) {
      return null;
    }

    return this.parseMessage(message);
  }

  static async markAsRead(
    userId: string,
    workspaceId: IWorkspaceId,
    messageId: string,
  ): Promise<IMessage> {
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        userId,
        workspaceId,
      },
    });

    if (!message) {
      throw new Error("Message not found");
    }

    const updated = await prisma.message.update({
      where: {
        id: messageId,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return this.parseMessage(updated);
  }

  static async markAllAsRead(
    userId: string,
    workspaceId: IWorkspaceId,
  ): Promise<void> {
    await prisma.message.updateMany({
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

  static async deleteMessage(
    userId: string,
    workspaceId: IWorkspaceId,
    messageId: string,
  ): Promise<void> {
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        userId,
        workspaceId,
      },
    });

    if (!message) {
      throw new Error("Message not found");
    }

    await prisma.message.delete({
      where: {
        id: messageId,
      },
    });
  }

  static async getUnreadCount(
    userId: string,
    workspaceId: IWorkspaceId,
  ): Promise<number> {
    return prisma.message.count({
      where: {
        userId,
        workspaceId,
        read: false,
      },
    });
  }

  private static parseMessage(message: {
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
  }): IMessage {
    let parsedActions = null;
    if (message.actions) {
      try {
        parsedActions = JSON.parse(message.actions);
      } catch {
        parsedActions = null;
      }
    }

    return MessageSchema.parse({
      id: message.id,
      userId: message.userId,
      title: message.title,
      content: message.content,
      type: message.type,
      actions: parsedActions,
      read: message.read,
      readAt: message.readAt ? message.readAt.toISOString() : null,
      relatedId: message.relatedId,
      relatedType: message.relatedType,
      createdAt: message.createdAt.toISOString(),
      updatedAt: message.updatedAt.toISOString(),
    });
  }
}
