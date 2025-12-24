import { withAuth } from "@/features/auth/context";
import {
  ApiError,
  createErrorResponse,
  ErrorCodes,
} from "@/features/shared/api/errors";
import { UpdateMessageInputSchema } from "@/features/shared/validation/schemas";
import { MessageService } from "@/features/message/services/message.service";
import { json } from "@tanstack/react-start";

/**
 * GET /api/v1/messages/:messageId
 * Get a single message
 */
export async function GET({
  request,
  params,
}: {
  request: Request;
  params: { messageId: string };
}) {
  try {
    return await withAuth(async (userId) => {
      const message = await MessageService.getMessageById(userId, params.messageId);

      if (!message) {
        return createErrorResponse(
          new ApiError(ErrorCodes.NOT_FOUND, "Message not found", 404)
        );
      }

      return json(message);
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

/**
 * PATCH /api/v1/messages/:messageId
 * Update a message (mark as read)
 */
export async function PATCH({
  request,
  params,
}: {
  request: Request;
  params: { messageId: string };
}) {
  try {
    return await withAuth(async (userId) => {
      const body = await request.json();
      const validated = UpdateMessageInputSchema.parse(body);

      if (validated.read) {
        const result = await MessageService.markAsRead(userId, params.messageId);
        return json(result);
      }

      // For now, only support marking as read
      return createErrorResponse(
        new ApiError(
          ErrorCodes.VALIDATION_ERROR,
          "Only 'read' field can be updated",
          400
        )
      );
    });
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
 * DELETE /api/v1/messages/:messageId
 * Delete a message
 */
export async function DELETE({
  request,
  params,
}: {
  request: Request;
  params: { messageId: string };
}) {
  try {
    return await withAuth(async (userId) => {
      await MessageService.deleteMessage(userId, params.messageId);
      return json({ success: true });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Message not found") {
      return createErrorResponse(
        new ApiError(ErrorCodes.NOT_FOUND, "Message not found", 404)
      );
    }
    return createErrorResponse(error);
  }
}

