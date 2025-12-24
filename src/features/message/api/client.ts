import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  buildQueryString,
} from "@/features/shared/api/client";
import type {
  ICreateMessageInput,
  IMessagesQuery,
  IMessagesResponse,
  IMessage,
  IUpdateMessageInput,
  IUnreadCountResponse,
} from "@/features/shared/validation/schemas";

/**
 * Message API Client
 * Client-side functions for interacting with message endpoints
 */

export async function getMessages(
  query?: IMessagesQuery
): Promise<IMessagesResponse> {
  const queryString = query ? buildQueryString(query) : "";
  return apiGet<IMessagesResponse>(`/messages${queryString}`);
}

export async function getMessage(messageId: string): Promise<IMessage> {
  return apiGet<IMessage>(`/messages/${messageId}`);
}

export async function createMessage(
  input: ICreateMessageInput
): Promise<IMessage> {
  return apiPost<IMessage>("/messages", input);
}

export async function markAsRead(messageId: string): Promise<IMessage> {
  return apiPatch<IMessage>(`/messages/${messageId}`, { read: true });
}

export async function markAllAsRead(): Promise<{ success: boolean }> {
  return apiPost<{ success: boolean }>("/messages/read-all", {});
}

export async function deleteMessage(
  messageId: string
): Promise<{ success: boolean }> {
  return apiDelete<{ success: boolean }>(`/messages/${messageId}`);
}

export async function getUnreadCount(): Promise<IUnreadCountResponse> {
  return apiGet<IUnreadCountResponse>("/messages/count");
}

