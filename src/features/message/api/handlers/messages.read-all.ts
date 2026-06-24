import { withWorkspaceAuth } from "@/features/auth/workspace-context";
import { createErrorResponse } from "@/features/shared/api/errors";
import { MessageService } from "@/features/message/services/message.service";
import { json } from "@tanstack/react-start";

/**
 * POST /api/v1/:workspaceId/messages/read-all
 * Mark all messages as read for the authenticated user
 */
export async function POST({
  request: _request,
  params,
}: {
  request: Request;
  params: { workspaceId: string };
}) {
  try {
    return await withWorkspaceAuth(
      params.workspaceId,
      async ({ userId, workspaceId }) => {
        await MessageService.markAllAsRead(userId, workspaceId);
        return json({ success: true });
      }
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}
