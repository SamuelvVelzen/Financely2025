import { withWorkspaceAuth } from "@/features/auth/workspace-context";
import { createErrorResponse } from "@/features/shared/api/errors";
import { SubscriptionsQuerySchema } from "@/features/shared/validation/schemas";
import { SubscriptionService } from "@/features/subscription/services/subscription.service";
import { json } from "@tanstack/react-start";

export async function GET({
  request,
  params,
}: {
  request: Request;
  params: { workspaceId: string };
}) {
  try {
    return await withWorkspaceAuth(
      params.workspaceId,
      async ({ userId, workspaceId }) => {
        const url = new URL(request.url);
        const query = {
          active: url.searchParams.get("active") ?? undefined,
        };

        const validated = SubscriptionsQuerySchema.parse(query);
        const result = await SubscriptionService.listSubscriptions(
          userId,
          workspaceId,
          validated
        );
        return json(result);
      }
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function POST({
  request,
  params,
}: {
  request: Request;
  params: { workspaceId: string };
}) {
  try {
    return await withWorkspaceAuth(
      params.workspaceId,
      async ({ userId, workspaceId }) => {
        const body = await request.json();
        const result = await SubscriptionService.confirmSubscription(
          userId,
          workspaceId,
          body
        );
        return json(result, { status: 201 });
      }
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}
