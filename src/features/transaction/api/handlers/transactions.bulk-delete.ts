import { withWorkspaceAuth } from "@/features/auth/workspace-context";
import { createErrorResponse } from "@/features/shared/api/errors";
import { BulkDeleteTransactionsInputSchema } from "@/features/shared/validation/schemas";
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
      const validated = BulkDeleteTransactionsInputSchema.parse(body);
      const result = await TransactionService.bulkDeleteTransactions(
        userId,
        workspaceId,
        validated.transactionIds,
      );
      return json(result);
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}