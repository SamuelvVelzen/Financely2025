import { withWorkspaceAuth } from "@/features/auth/workspace-context";
import { createErrorResponse } from "@/features/shared/api/errors";
import { DetectSubscriptionsOptionsSchema } from "@/features/shared/validation/schemas";
import { SubscriptionDetectionService } from "@/features/subscription/services/subscription-detection.service";
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
        const transactionIds = url.searchParams.getAll("transactionIds");
        const options = DetectSubscriptionsOptionsSchema.parse({
          transactionIds:
            transactionIds.length > 0 ? transactionIds : undefined,
          from: url.searchParams.get("from") ?? undefined,
          to: url.searchParams.get("to") ?? undefined,
        });

        const hasScope =
          (options.transactionIds?.length ?? 0) > 0 ||
          (options.from !== undefined && options.to !== undefined);

        const candidates =
          await SubscriptionDetectionService.detectSubscriptions(
            userId,
            workspaceId,
            hasScope ? options : undefined,
          );
        return json({ candidates });
      }
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}
