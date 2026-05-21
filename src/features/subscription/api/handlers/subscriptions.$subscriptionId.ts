import { withWorkspaceAuth } from "@/features/auth/workspace-context";
import {
  ApiError,
  ErrorCodes,
  createErrorResponse,
} from "@/features/shared/api/errors";
import { SubscriptionService } from "@/features/subscription/services/subscription.service";
import { json } from "@tanstack/react-start";

export async function GET({
  params,
}: {
  params: { workspaceId: string; subscriptionId: string };
}) {
  try {
    return await withWorkspaceAuth(
      params.workspaceId,
      async ({ userId, workspaceId }) => {
        const result = await SubscriptionService.getSubscriptionById(
          userId,
          workspaceId,
          params.subscriptionId
        );
        if (!result) {
          throw new ApiError(
            ErrorCodes.NOT_FOUND,
            "Subscription not found",
            404
          );
        }
        return json(result);
      }
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function PATCH({
  request,
  params,
}: {
  request: Request;
  params: { workspaceId: string; subscriptionId: string };
}) {
  try {
    return await withWorkspaceAuth(
      params.workspaceId,
      async ({ userId, workspaceId }) => {
        const body = await request.json();
        const result = await SubscriptionService.updateSubscription(
          userId,
          workspaceId,
          params.subscriptionId,
          body
        );
        return json(result);
      }
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function DELETE({
  params,
}: {
  params: { workspaceId: string; subscriptionId: string };
}) {
  try {
    return await withWorkspaceAuth(
      params.workspaceId,
      async ({ userId, workspaceId }) => {
        await SubscriptionService.deleteSubscription(
          userId,
          workspaceId,
          params.subscriptionId
        );
        return json({ success: true });
      }
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}
