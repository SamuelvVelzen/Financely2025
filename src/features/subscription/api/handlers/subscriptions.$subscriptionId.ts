import { withAuth } from "@/features/auth/context";
import {
  ApiError,
  ErrorCodes,
  createErrorResponse,
} from "@/features/shared/api/errors";
import { SubscriptionService } from "@/features/subscription/services/subscription.service";
import { json } from "@tanstack/react-start";

function getSubscriptionId(request: Request): string {
  const url = new URL(request.url);
  const parts = url.pathname.split("/");
  return parts[parts.length - 1];
}

export async function GET({ request }: { request: Request }) {
  try {
    return await withAuth(async (userId) => {
      const subscriptionId = getSubscriptionId(request);
      const result = await SubscriptionService.getSubscriptionById(
        userId,
        subscriptionId,
      );
      if (!result) {
        throw new ApiError(
          ErrorCodes.NOT_FOUND,
          "Subscription not found",
          404,
        );
      }
      return json(result);
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function PATCH({ request }: { request: Request }) {
  try {
    return await withAuth(async (userId) => {
      const subscriptionId = getSubscriptionId(request);
      const body = await request.json();
      const result = await SubscriptionService.updateSubscription(
        userId,
        subscriptionId,
        body,
      );
      return json(result);
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function DELETE({ request }: { request: Request }) {
  try {
    return await withAuth(async (userId) => {
      const subscriptionId = getSubscriptionId(request);
      await SubscriptionService.deleteSubscription(userId, subscriptionId);
      return json({ success: true });
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
