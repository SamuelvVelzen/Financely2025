import { withWorkspaceAuth } from "@/features/auth/workspace-context";
import { createErrorResponse } from "@/features/shared/api/errors";
import { SubscriptionService } from "@/features/subscription/services/subscription.service";
import { json } from "@tanstack/react-start";

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
        await SubscriptionService.dismissCandidate(userId, workspaceId, body);
        return json({ success: true });
      }
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}
