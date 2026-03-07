import { withAuth } from "@/features/auth/context";
import { createErrorResponse } from "@/features/shared/api/errors";
import { SubscriptionDetectionService } from "@/features/subscription/services/subscription-detection.service";
import { json } from "@tanstack/react-start";

export async function GET() {
  try {
    return await withAuth(async (userId) => {
      const candidates =
        await SubscriptionDetectionService.detectSubscriptions(userId);
      return json({ candidates });
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
