import { withAuth } from "@/features/auth/context";
import { createErrorResponse } from "@/features/shared/api/errors";
import { SubscriptionsQuerySchema } from "@/features/shared/validation/schemas";
import { SubscriptionService } from "@/features/subscription/services/subscription.service";
import { json } from "@tanstack/react-start";

export async function GET({ request }: { request: Request }) {
  try {
    return await withAuth(async (userId) => {
      const url = new URL(request.url);
      const query = {
        active:
          url.searchParams.get("active") ?? undefined,
      };

      const validated = SubscriptionsQuerySchema.parse(query);
      const result = await SubscriptionService.listSubscriptions(
        userId,
        validated,
      );
      return json(result);
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function POST({ request }: { request: Request }) {
  try {
    return await withAuth(async (userId) => {
      const body = await request.json();
      const result = await SubscriptionService.confirmSubscription(
        userId,
        body,
      );
      return json(result, { status: 201 });
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
