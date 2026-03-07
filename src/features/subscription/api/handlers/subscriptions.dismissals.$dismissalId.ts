import { withAuth } from "@/features/auth/context";
import { createErrorResponse } from "@/features/shared/api/errors";
import { SubscriptionService } from "@/features/subscription/services/subscription.service";
import { json } from "@tanstack/react-start";

export async function DELETE({
  params,
}: {
  params: { dismissalId: string };
}) {
  try {
    return await withAuth(async (userId) => {
      await SubscriptionService.undismissCandidate(
        userId,
        params.dismissalId,
      );
      return json({ success: true });
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
