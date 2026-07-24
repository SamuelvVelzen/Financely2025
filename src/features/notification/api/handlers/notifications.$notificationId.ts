import { withWorkspaceAuth } from "@/features/auth/workspace-context";
import {
  ApiError,
  createErrorResponse,
  ErrorCodes,
} from "@/features/shared/api/errors";
import { UpdateNotificationInputSchema } from "@/features/shared/validation/schemas";
import { NotificationService } from "@/features/notification/services/notification.service";
import { json } from "@tanstack/react-start";

/**
 * GET /api/v1/:workspaceId/notifications/:notificationId
 * Get a single notification
 */
export async function GET({
  request: _request,
  params,
}: {
  request: Request;
  params: { workspaceId: string; notificationId: string };
}) {
  try {
    return await withWorkspaceAuth(
      params.workspaceId,
      async ({ userId, workspaceId }) => {
        const notification = await NotificationService.getNotificationById(
          userId,
          workspaceId,
          params.notificationId,
        );

        if (!notification) {
          return createErrorResponse(
            new ApiError(ErrorCodes.NOT_FOUND, "Notification not found", 404),
          );
        }

        return json(notification);
      },
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}

/**
 * PATCH /api/v1/:workspaceId/notifications/:notificationId
 * Update a notification (mark as read)
 */
export async function PATCH({
  request,
  params,
}: {
  request: Request;
  params: { workspaceId: string; notificationId: string };
}) {
  try {
    return await withWorkspaceAuth(
      params.workspaceId,
      async ({ userId, workspaceId }) => {
        const body = await request.json();
        const validated = UpdateNotificationInputSchema.parse(body);

        if (validated.read) {
          const result = await NotificationService.markAsRead(
            userId,
            workspaceId,
            params.notificationId,
          );
          return json(result);
        }

        return createErrorResponse(
          new ApiError(
            ErrorCodes.VALIDATION_ERROR,
            "Only 'read' field can be updated",
            400,
          ),
        );
      },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Notification not found") {
      return createErrorResponse(
        new ApiError(ErrorCodes.NOT_FOUND, "Notification not found", 404),
      );
    }
    return createErrorResponse(error);
  }
}

/**
 * DELETE /api/v1/:workspaceId/notifications/:notificationId
 * Delete a notification
 */
export async function DELETE({
  request: _request,
  params,
}: {
  request: Request;
  params: { workspaceId: string; notificationId: string };
}) {
  try {
    return await withWorkspaceAuth(
      params.workspaceId,
      async ({ userId, workspaceId }) => {
        await NotificationService.deleteNotification(
          userId,
          workspaceId,
          params.notificationId,
        );
        return json({ success: true });
      },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Notification not found") {
      return createErrorResponse(
        new ApiError(ErrorCodes.NOT_FOUND, "Notification not found", 404),
      );
    }
    return createErrorResponse(error);
  }
}
