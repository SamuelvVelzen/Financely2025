import { withWorkspaceAuth } from "@/features/auth/workspace-context";
import { createErrorResponse } from "@/features/shared/api/errors";
import { NotificationService } from "@/features/notification/services/notification.service";
import { json } from "@tanstack/react-start";

/**
 * POST /api/v1/:workspaceId/notifications/read-all
 * Mark all notifications as read for the authenticated user
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
        await NotificationService.markAllAsRead(userId, workspaceId);
        return json({ success: true });
      },
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}
