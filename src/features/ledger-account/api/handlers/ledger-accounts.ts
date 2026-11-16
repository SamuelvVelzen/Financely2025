import { withWorkspaceAuth } from "@/features/auth/workspace-context";
import { createErrorResponse } from "@/features/shared/api/errors";
import {
  CreateLedgerAccountInputSchema,
  LedgerAccountSchema,
} from "@/features/shared/validation/schemas";
import { LedgerAccountService } from "@/features/ledger-account/services/ledger-account.service";
import { json } from "@tanstack/react-start";

export async function GET({
  params,
}: {
  params: { workspaceId: string };
}) {
  try {
    return await withWorkspaceAuth(params.workspaceId, async ({ userId, workspaceId }) => {
      const data = await LedgerAccountService.list(userId, workspaceId);
      return json({ data });
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

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
      const validated = CreateLedgerAccountInputSchema.parse(body);
      const created = await LedgerAccountService.create(
        userId,
        workspaceId,
        validated,
      );
      return json(LedgerAccountSchema.parse(created), { status: 201 });
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
