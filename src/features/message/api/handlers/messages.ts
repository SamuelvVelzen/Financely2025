import { withAuth } from "@/features/auth/context";
import {
  ApiError,
  createErrorResponse,
  ErrorCodes,
} from "@/features/shared/api/errors";
import { MessagesQuerySchema } from "@/features/shared/validation/schemas";
import { MessageService } from "@/features/message/services/message.service";
import { json } from "@tanstack/react-start";

/**
 * GET /api/v1/messages
 * List messages with optional filtering and pagination
 */
export async function GET({ request }: { request: Request }) {
  try {
    return await withAuth(async (userId) => {
      const url = new URL(request.url);
      const readParam = url.searchParams.get("read");
      
      const query = {
        page: url.searchParams.get("page") ?? undefined,
        limit: url.searchParams.get("limit") ?? undefined,
        read: readParam === null ? undefined : readParam === "true",
        type: url.searchParams.get("type") ?? undefined,
      };

      const validated = MessagesQuerySchema.parse(query);
      const result = await MessageService.listMessages(userId, validated);
      return json(result);
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

/**
 * POST /api/v1/messages
 * Create a new message (for system/admin use)
 */
export async function POST({ request }: { request: Request }) {
  try {
    return await withAuth(async (userId) => {
      const body = await request.json();
      const result = await MessageService.createMessage(userId, body);

      return json(result, { status: 201 });
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

