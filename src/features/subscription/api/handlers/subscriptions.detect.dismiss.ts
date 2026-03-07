import { withAuth } from "@/features/auth/context";
import { createErrorResponse } from "@/features/shared/api/errors";
import { SubscriptionService } from "@/features/subscription/services/subscription.service";
import { json } from "@tanstack/react-start";

export async function POST({ request }: { request: Request }) {
  try {
    return await withAuth(async (userId) => {
      const body = await request.json();
      await SubscriptionService.dismissCandidate(userId, body);
      return json({ success: true });
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
