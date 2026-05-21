import { withWorkspaceAuth } from "@/features/auth/workspace-context";
import { createErrorResponse } from "@/features/shared/api/errors";
import { SubscriptionDetectionService } from "@/features/subscription/services/subscription-detection.service";
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
        const candidates =
          await SubscriptionDetectionService.detectSubscriptions(
            userId,
            workspaceId
          );
        return json({ candidates });
      }
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}
