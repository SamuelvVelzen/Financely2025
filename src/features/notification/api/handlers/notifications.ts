import { withWorkspaceAuth } from "@/features/auth/workspace-context";
import { createErrorResponse } from "@/features/shared/api/errors";
import { NotificationsQuerySchema } from "@/features/shared/validation/schemas";
import { NotificationService } from "@/features/notification/services/notification.service";
import { json } from "@tanstack/react-start";

/**
 * GET /api/v1/:workspaceId/notifications
 * List notifications with optional filtering and pagination
 */
export async function GET({
  request,
  params,
}: {
  request: Request;
  params: { workspaceId: string };
}) {
  try {
    return await withWorkspaceAuth(
      params.workspaceId,
      async ({ userId, workspaceId }) => {
        const url = new URL(request.url);
        const readParam = url.searchParams.get("read");

        const query = {
          page: url.searchParams.get("page") ?? undefined,
          limit: url.searchParams.get("limit") ?? undefined,
          read: readParam === null ? undefined : readParam === "true",
          type: url.searchParams.get("type") ?? undefined,
        };

        const validated = NotificationsQuerySchema.parse(query);
        const result = await NotificationService.listNotifications(
          userId,
          workspaceId,
          validated,
        );
        return json(result);
      },
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}

/**
 * POST /api/v1/:workspaceId/notifications
 * Create a new notification (for system/admin use)
 */
export async function POST({
  request,
  params,
}: {
  request: Request;
  params: { workspaceId: string };
}) {
  try {
    return await withWorkspaceAuth(
      params.workspaceId,
      async ({ userId, workspaceId }) => {
        const body = await request.json();
        const result = await NotificationService.createNotification(
          userId,
          workspaceId,
          body,
        );

        return json(result, { status: 201 });
      },
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}
