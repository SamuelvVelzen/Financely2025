import { withAuth } from "@/features/auth/context";
import { createErrorResponse } from "@/features/shared/api/errors";
import { SubscriptionService } from "@/features/subscription/services/subscription.service";
import { json } from "@tanstack/react-start";

export async function GET() {
  try {
    return await withAuth(async (userId) => {
      const result = await SubscriptionService.listDismissals(userId);
      return json(result);
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
