import { withWorkspaceAuth } from "@/features/auth/workspace-context";
import {
  ApiError,
  createErrorResponse,
  ErrorCodes,
} from "@/features/shared/api/errors";
import { UpdateMessageInputSchema } from "@/features/shared/validation/schemas";
import { MessageService } from "@/features/message/services/message.service";
import { json } from "@tanstack/react-start";

/**
 * GET /api/v1/:workspaceId/messages/:messageId
 * Get a single message
 */
export async function GET({
  request: _request,
  params,
}: {
  request: Request;
  params: { workspaceId: string; messageId: string };
}) {
  try {
    return await withWorkspaceAuth(
      params.workspaceId,
      async ({ userId, workspaceId }) => {
        const message = await MessageService.getMessageById(
          userId,
          workspaceId,
          params.messageId
        );

        if (!message) {
          return createErrorResponse(
            new ApiError(ErrorCodes.NOT_FOUND, "Message not found", 404)
          );
        }

        return json(message);
      }
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}

/**
 * PATCH /api/v1/:workspaceId/messages/:messageId
 * Update a message (mark as read)
 */
export async function PATCH({
  request,
  params,
}: {
  request: Request;
  params: { workspaceId: string; messageId: string };
}) {
  try {
    return await withWorkspaceAuth(
      params.workspaceId,
      async ({ userId, workspaceId }) => {
        const body = await request.json();
        const validated = UpdateMessageInputSchema.parse(body);

        if (validated.read) {
          const result = await MessageService.markAsRead(
            userId,
            workspaceId,
            params.messageId
          );
          return json(result);
        }

        return createErrorResponse(
          new ApiError(
            ErrorCodes.VALIDATION_ERROR,
            "Only 'read' field can be updated",
            400
          )
        );
      }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Message not found") {
      return createErrorResponse(
        new ApiError(ErrorCodes.NOT_FOUND, "Message not found", 404)
      );
    }
    return createErrorResponse(error);
  }
}

/**
 * DELETE /api/v1/:workspaceId/messages/:messageId
 * Delete a message
 */
export async function DELETE({
  request: _request,
  params,
}: {
  request: Request;
  params: { workspaceId: string; messageId: string };
}) {
  try {
    return await withWorkspaceAuth(
      params.workspaceId,
      async ({ userId, workspaceId }) => {
        await MessageService.deleteMessage(
          userId,
          workspaceId,
          params.messageId
        );
        return json({ success: true });
      }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Message not found") {
      return createErrorResponse(
        new ApiError(ErrorCodes.NOT_FOUND, "Message not found", 404)
      );
    }
    return createErrorResponse(error);
  }
}
