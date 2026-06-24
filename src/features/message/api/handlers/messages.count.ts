import { withWorkspaceAuth } from "@/features/auth/workspace-context";
import { createErrorResponse } from "@/features/shared/api/errors";
import { MessageService } from "@/features/message/services/message.service";
import { json } from "@tanstack/react-start";

/**
 * GET /api/v1/:workspaceId/messages/count
 * Get unread message count for the authenticated user
 */
export async function GET({
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
        const count = await MessageService.getUnreadCount(userId, workspaceId);
        return json({ count });
      }
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}
