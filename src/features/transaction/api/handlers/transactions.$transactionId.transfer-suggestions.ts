import { withWorkspaceAuth } from "@/features/auth/workspace-context";
import { createErrorResponse } from "@/features/shared/api/errors";
import { json } from "@tanstack/react-start";
import { TransferMatchingService } from "../../services/transfer-matching.service";

export async function GET({
  params,
}: {
  params: { workspaceId: string; transactionId: string };
}) {
  try {
    return await withWorkspaceAuth(params.workspaceId, async ({ userId, workspaceId }) => {
      const result = await TransferMatchingService.getSuggestionsForTransaction(
        userId,
        workspaceId,
        params.transactionId,
      );
      return json(result);
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
