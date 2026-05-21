import { withWorkspaceAuth } from "@/features/auth/workspace-context";
import { createErrorResponse } from "@/features/shared/api/errors";
import { SubscriptionService } from "@/features/subscription/services/subscription.service";
import { json } from "@tanstack/react-start";

export async function DELETE({
  params,
}: {
  params: { workspaceId: string; dismissalId: string };
}) {
  try {
    return await withWorkspaceAuth(
      params.workspaceId,
      async ({ userId, workspaceId }) => {
        await SubscriptionService.undismissCandidate(
          userId,
          workspaceId,
          params.dismissalId
        );
        return json({ success: true });
      }
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}
