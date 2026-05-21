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
import { workspaceApiV1Path } from "@/features/workspace/workspace-api-path";
import type { IWorkspaceId } from "@/features/workspace/workspace-id";

export async function getMessages(
  workspaceId: IWorkspaceId,
  query?: IMessagesQuery,
): Promise<IMessagesResponse> {
  const queryString = query ? buildQueryString(query) : "";
  return apiGet<IMessagesResponse>(
    `${workspaceApiV1Path(workspaceId, "messages")}${queryString}`,
  );
}

export async function getMessage(
  workspaceId: IWorkspaceId,
  messageId: string,
): Promise<IMessage> {
  return apiGet<IMessage>(
    workspaceApiV1Path(workspaceId, `messages/${messageId}`),
  );
}

export async function createMessage(
  workspaceId: IWorkspaceId,
  input: ICreateMessageInput,
): Promise<IMessage> {
  return apiPost<IMessage>(
    workspaceApiV1Path(workspaceId, "messages"),
    input,
  );
}

export async function markAsRead(
  workspaceId: IWorkspaceId,
  messageId: string,
): Promise<IMessage> {
  return apiPatch<IMessage>(
    workspaceApiV1Path(workspaceId, `messages/${messageId}`),
    { read: true },
  );
}

export async function markAllAsRead(
  workspaceId: IWorkspaceId,
): Promise<{ success: boolean }> {
  return apiPost<{ success: boolean }>(
    workspaceApiV1Path(workspaceId, "messages/read-all"),
    {},
  );
}

export async function deleteMessage(
  workspaceId: IWorkspaceId,
  messageId: string,
): Promise<{ success: boolean }> {
  return apiDelete<{ success: boolean }>(
    workspaceApiV1Path(workspaceId, `messages/${messageId}`),
  );
}

export async function getUnreadCount(
  workspaceId: IWorkspaceId,
): Promise<IUnreadCountResponse> {
  return apiGet<IUnreadCountResponse>(
    workspaceApiV1Path(workspaceId, "messages/count"),
  );
}
