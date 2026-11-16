import { withWorkspaceAuth } from "@/features/auth/workspace-context";
import { createErrorResponse } from "@/features/shared/api/errors";
import { BulkUpdateTransactionTypeInputSchema } from "@/features/shared/validation/schemas";
import { json } from "@tanstack/react-start";
import { TransactionService } from "../../services/transaction.service";

export async function POST({
  request,
  params,
}: {
  request: Request;
  params: { workspaceId: string };
}) {
  try {
    return await withWorkspaceAuth(params.workspaceId, async ({ userId, workspaceId }) => {
      const body = await request.json();
      const validated = BulkUpdateTransactionTypeInputSchema.parse(body);
      const result = await TransactionService.bulkUpdateTransactionType(
        userId,
        workspaceId,
        validated,
      );
      return json(result);
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
