import {
  CreateMessageInputSchema,
  MessageSchema,
  MessagesQuerySchema,
  MessagesResponseSchema,
  UpdateMessageInputSchema,
  type ICreateMessageInput,
  type IMessagesQuery,
  type IMessagesResponse,
  type IMessage,
  type IUpdateMessageInput,
} from "@/features/shared/validation/schemas";
import { prisma } from "@/features/util/prisma";

/**
 * Message Service
 * Handles message-related business logic and data access
 */
export class MessageService {
  /**
   * Create a new message
   */
  static async createMessage(
    userId: string,
    input: ICreateMessageInput
  ): Promise<IMessage> {
    const validated = CreateMessageInputSchema.parse(input);

    const message = await prisma.message.create({
      data: {
        userId,
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

  /**
   * List messages for a user with pagination and filtering
   */
  static async listMessages(
    userId: string,
    query: IMessagesQuery
  ): Promise<IMessagesResponse> {
    const validated = MessagesQuerySchema.parse(query);

    const where: any = {
      userId,
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

  /**
   * Get message by ID (user-scoped)
   */
  static async getMessageById(
    userId: string,
    messageId: string
  ): Promise<IMessage | null> {
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        userId,
      },
    });

    if (!message) {
      return null;
    }

    return this.parseMessage(message);
  }

  /**
   * Mark message as read
   */
  static async markAsRead(
    userId: string,
    messageId: string
  ): Promise<IMessage> {
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        userId,
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

  /**
   * Mark all messages as read for a user
   */
  static async markAllAsRead(userId: string): Promise<void> {
    await prisma.message.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Delete a message
   */
  static async deleteMessage(userId: string, messageId: string): Promise<void> {
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        userId,
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

  /**
   * Get unread count for a user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    return prisma.message.count({
      where: {
        userId,
        read: false,
      },
    });
  }

  /**
   * Parse message from database format to API format
   */
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
      } catch (e) {
        // Invalid JSON, ignore
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

