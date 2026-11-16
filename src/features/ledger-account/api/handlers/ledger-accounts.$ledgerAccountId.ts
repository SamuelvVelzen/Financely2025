import { withWorkspaceAuth } from "@/features/auth/workspace-context";
import { createErrorResponse } from "@/features/shared/api/errors";
import {
  LedgerAccountSchema,
  UpdateLedgerAccountInputSchema,
} from "@/features/shared/validation/schemas";
import { LedgerAccountService } from "@/features/ledger-account/services/ledger-account.service";
import { json } from "@tanstack/react-start";

export async function GET({
  params,
}: {
  params: { workspaceId: string; ledgerAccountId: string };
}) {
  try {
    return await withWorkspaceAuth(params.workspaceId, async ({ userId, workspaceId }) => {
      const row = await LedgerAccountService.getById(
        userId,
        workspaceId,
        params.ledgerAccountId,
      );
      if (!row) {
        return json({ error: "Not found" }, { status: 404 });
      }
      return json(LedgerAccountSchema.parse(row));
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function PATCH({
  request,
  params,
}: {
  request: Request;
  params: { workspaceId: string; ledgerAccountId: string };
}) {
  try {
    return await withWorkspaceAuth(params.workspaceId, async ({ userId, workspaceId }) => {
      const body = await request.json();
      const validated = UpdateLedgerAccountInputSchema.parse(body);
      const updated = await LedgerAccountService.update(
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

