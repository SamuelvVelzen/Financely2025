import { apiGet, apiPatch, apiPost } from "@/features/shared/api/client";
import type {
  ICashCountInput,
  ICreateLedgerAccountInput,
  ILedgerAccount,
  IUpdateLedgerAccountInput,
} from "@/features/shared/validation/schemas";
import { workspaceApiV1Path } from "@/features/workspace/workspace-api-path";
import type { IWorkspaceId } from "@/features/workspace/workspace-id";

export async function getLedgerAccounts(
  workspaceId: IWorkspaceId,
): Promise<{ data: ILedgerAccount[] }> {
  return apiGet(workspaceApiV1Path(workspaceId, "ledger-accounts"));
}

export async function createLedgerAccount(
  workspaceId: IWorkspaceId,
  input: ICreateLedgerAccountInput,
): Promise<ILedgerAccount> {
  return apiPost(workspaceApiV1Path(workspaceId, "ledger-accounts"), input);
}

export async function updateLedgerAccount(
  workspaceId: IWorkspaceId,
  accountId: string,
  input: IUpdateLedgerAccountInput,
): Promise<ILedgerAccount> {
  return apiPatch(
    workspaceApiV1Path(workspaceId, `ledger-accounts/${accountId}`),
    input,
  );
}

export async function recordCashCount(
  workspaceId: IWorkspaceId,
  accountId: string,
  input: ICashCountInput,
): Promise<ILedgerAccount> {
  return apiPost(
    workspaceApiV1Path(workspaceId, `ledger-accounts/${accountId}/cash-count`),
    input,
  );
}
