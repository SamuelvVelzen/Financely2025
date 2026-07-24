import { withWorkspaceAuth } from "@/features/auth/workspace-context";
import { createErrorResponse } from "@/features/shared/api/errors";
import { NotificationService } from "@/features/notification/services/notification.service";
import { json } from "@tanstack/react-start";

/**
 * GET /api/v1/:workspaceId/notifications/count
 * Get unread notification count for the authenticated user
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
        const count = await NotificationService.getUnreadCount(
          userId,
          workspaceId,
        );
        return json({ count });
      },
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}
