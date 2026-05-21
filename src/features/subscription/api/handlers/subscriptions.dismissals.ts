import { withWorkspaceAuth } from "@/features/auth/workspace-context";
import { createErrorResponse } from "@/features/shared/api/errors";
import { SubscriptionService } from "@/features/subscription/services/subscription.service";
import { json } from "@tanstack/react-start";

export async function GET({
  params,
}: {
  params: { workspaceId: string };
}) {
  try {
    return await withWorkspaceAuth(
      params.workspaceId,
      async ({ userId, workspaceId }) => {
        const result = await SubscriptionService.listDismissals(
          userId,
          workspaceId
        );
        return json(result);
      }
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}
