import { withWorkspaceAuth } from "@/features/auth/workspace-context";
import { createErrorResponse } from "@/features/shared/api/errors";
import { PairTransferInputSchema } from "@/features/shared/validation/schemas";
import { json } from "@tanstack/react-start";
import { TransferService } from "../../services/transfer.service";

export async function POST({
  request,
  params,
}: {
  request: Request;
  params: { workspaceId: string; transactionId: string };
}) {
  try {
    return await withWorkspaceAuth(params.workspaceId, async ({ userId, workspaceId }) => {
      const body = await request.json();
      const validated = PairTransferInputSchema.parse(body);
      const result = await TransferService.pairExisting(
        userId,
        workspaceId,
        params.transactionId,
        validated.otherTransactionId,
      );
      return json(result);
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
