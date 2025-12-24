import { withAuth } from "@/features/auth/context";
import { createErrorResponse } from "@/features/shared/api/errors";
import { MessageService } from "@/features/message/services/message.service";
import { json } from "@tanstack/react-start";

/**
 * GET /api/v1/messages/count
 * Get unread message count for the authenticated user
 */
export async function GET({ request }: { request: Request }) {
  try {
    return await withAuth(async (userId) => {
      const count = await MessageService.getUnreadCount(userId);
      return json({ count });
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

