import { useFinMutation, useFinQuery } from "@/features/shared/query/core";
import { queryKeys } from "@/features/shared/query/keys";
import type {
  ICashCountInput,
  ICreateLedgerAccountInput,
  ILedgerAccount,
  IUpdateLedgerAccountInput,
} from "@/features/shared/validation/schemas";
import { useNavWorkspaceId } from "@/features/workspace/hooks/use-nav-workspace-id";
import { useQueryClient } from "@tanstack/react-query";
import {
  createLedgerAccount,
  getLedgerAccounts,
  recordCashCount,
  updateLedgerAccount,
} from "../api/client";

function requireWorkspaceId(id: number | null): number {
  if (id == null) throw new Error("Workspace is required");
  return id;
}

export function useLedgerAccounts() {
  const workspaceId = useNavWorkspaceId();
  return useFinQuery<{ data: ILedgerAccount[] }, Error>({
    queryKey:
      workspaceId != null
        ? queryKeys.ledgerAccounts(workspaceId)
        : (["ledger-accounts", "disabled"] as const),
    queryFn: () => getLedgerAccounts(requireWorkspaceId(workspaceId)),
    staleTime: 60_000,
    enabled: workspaceId != null,
  });
}

export function useCreateLedgerAccount() {
  const workspaceId = useNavWorkspaceId();
  const queryClient = useQueryClient();
  return useFinMutation({
    mutationFn: (input: ICreateLedgerAccountInput) =>
      createLedgerAccount(requireWorkspaceId(workspaceId), input),
    onSuccess: () => {
      if (workspaceId != null) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.ledgerAccounts(workspaceId),
        });
      }
    },
  });
}

export function useUpdateLedgerAccount() {
  const workspaceId = useNavWorkspaceId();
  const queryClient = useQueryClient();
  return useFinMutation({
    mutationFn: ({
      accountId,
      input,
    }: {
      accountId: string;
      input: IUpdateLedgerAccountInput;
    }) => updateLedgerAccount(requireWorkspaceId(workspaceId), accountId, input),
    onSuccess: () => {
      if (workspaceId != null) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.ledgerAccounts(workspaceId),
        });
      }
    },
  });
}

export function useCashCount() {
  const workspaceId = useNavWorkspaceId();
  const queryClient = useQueryClient();
  return useFinMutation({
    mutationFn: ({
      accountId,
      input,
    }: {
      accountId: string;
      input: ICashCountInput;
    }) => recordCashCount(requireWorkspaceId(workspaceId), accountId, input),
    onSuccess: () => {
      if (workspaceId != null) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.ledgerAccounts(workspaceId),
        });
        void queryClient.invalidateQueries({
          queryKey: ["transactions", workspaceId],
        });
      }
    },
  });
}
