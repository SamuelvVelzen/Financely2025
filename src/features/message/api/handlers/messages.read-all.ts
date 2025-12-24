import { withAuth } from "@/features/auth/context";
import { createErrorResponse } from "@/features/shared/api/errors";
import { MessageService } from "@/features/message/services/message.service";
import { json } from "@tanstack/react-start";

/**
 * POST /api/v1/messages/read-all
 * Mark all messages as read for the authenticated user
 */
export async function POST({ request }: { request: Request }) {
  try {
    return await withAuth(async (userId) => {
      await MessageService.markAllAsRead(userId);
      return json({ success: true });
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

