import { withWorkspaceAuth } from "@/features/auth/workspace-context";
import { createErrorResponse } from "@/features/shared/api/errors";
import {
  CashCountInputSchema,
  LedgerAccountSchema,
} from "@/features/shared/validation/schemas";
import { LedgerAccountService } from "@/features/ledger-account/services/ledger-account.service";
import { json } from "@tanstack/react-start";

export async function POST({
  request,
  params,
}: {
  request: Request;
  params: { workspaceId: string; ledgerAccountId: string };
}) {
  try {
    return await withWorkspaceAuth(params.workspaceId, async ({ userId, workspaceId }) => {
      const body = await request.json();
      const validated = CashCountInputSchema.parse(body);
      const updated = await LedgerAccountService.recordCashCount(
        userId,
        workspaceId,
        params.ledgerAccountId,
        validated,
      );
      return json(LedgerAccountSchema.parse(updated));
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
