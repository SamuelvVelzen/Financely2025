import {
  addSplitMember,
  createSplitExpense,
  createSplitGroup,
  createSplitSettlement,
  deleteSplitExpense,
  deleteSplitGroup,
  deleteSplitSettlement,
  getSplitBalances,
  getSplitExpenses,
  getSplitGroup,
  getSplitGroups,
  getSplitSettlements,
  getSplitSummary,
  removeSplitMember,
  updateSplitExpense,
  updateSplitGroup,
  updateSplitSettlement,
} from "@/features/split/api/client";
import {
  buildOptimisticSplitExpense,
  type ISplitExpense,
} from "@/features/split/offline/split-offline-optimistic";
import { useFinMutation, useFinQuery } from "@/features/shared/query/core";
import { queryKeys } from "@/features/shared/query/keys";
import type {
  IAddSplitMemberInput,
  ICreateSplitExpenseInput,
  ICreateSplitGroupInput,
  ICreateSplitSettlementInput,
  IUpdateSplitExpenseInput,
  IUpdateSplitGroupInput,
  IUpdateSplitSettlementInput,
} from "@/features/shared/validation/schemas";
import { useQueryClient } from "@tanstack/react-query";

export function useSplitGroups() {
  return useFinQuery({
    queryKey: queryKeys.splitGroups(),
    queryFn: getSplitGroups,
    staleTime: 60 * 1000,
  });
}

export function useSplitSummary() {
  return useFinQuery({
    queryKey: queryKeys.splitSummary(),
    queryFn: getSplitSummary,
    staleTime: 60 * 1000,
  });
}

export function useSplitGroup(groupId: string) {
  return useFinQuery({
    queryKey: queryKeys.splitGroup(groupId),
    queryFn: () => getSplitGroup(groupId),
    staleTime: 60 * 1000,
    enabled: Boolean(groupId),
  });
}

export function useSplitExpenses(groupId: string) {
  return useFinQuery<{ expenses: ISplitExpense[] }>({
    queryKey: queryKeys.splitExpenses(groupId),
    queryFn: () => getSplitExpenses(groupId) as Promise<{ expenses: ISplitExpense[] }>,
    staleTime: 30 * 1000,
    enabled: Boolean(groupId),
  });
}

export function useSplitBalances(groupId: string) {
  return useFinQuery({
    queryKey: queryKeys.splitBalances(groupId),
    queryFn: () => getSplitBalances(groupId),
    staleTime: 30 * 1000,
    enabled: Boolean(groupId),
  });
}

export function useSplitSettlements(groupId: string) {
  return useFinQuery({
    queryKey: queryKeys.splitSettlements(groupId),
    queryFn: () => getSplitSettlements(groupId),
    staleTime: 30 * 1000,
    enabled: Boolean(groupId),
  });
}

export function useCreateSplitGroup() {
  const queryClient = useQueryClient();
  return useFinMutation({
    mutationFn: (input: ICreateSplitGroupInput) => createSplitGroup(input),
    invalidateQueries: [() => queryKeys.splitGroups(), () => queryKeys.splitSummary()],
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.splitGroups() });
    },
  });
}

export function useUpdateSplitGroup(groupId: string) {
  return useFinMutation({
    mutationFn: (input: IUpdateSplitGroupInput) =>
      updateSplitGroup(groupId, input),
    invalidateQueries: [
      () => queryKeys.splitGroup(groupId),
      () => queryKeys.splitGroups(),
      () => queryKeys.splitSummary(),
    ],
  });
}

export function useDeleteSplitGroup() {
  return useFinMutation({
    mutationFn: (groupId: string) => deleteSplitGroup(groupId),
    invalidateQueries: [
      () => queryKeys.splitGroups(),
      () => queryKeys.splitSummary(),
    ],
  });
}

export function useCreateSplitExpense(groupId: string) {
  const queryClient = useQueryClient();
  return useFinMutation({
    mutationFn: (input: ICreateSplitExpenseInput) =>
      createSplitExpense(groupId, input),
    invalidateQueries: [
      () => queryKeys.splitExpenses(groupId),
      () => queryKeys.splitBalances(groupId),
      () => queryKeys.splitSummary(),
    ],
    onMutate: async (input) => {
      const clientMutationId = input.clientMutationId ?? crypto.randomUUID();
      const optimistic = buildOptimisticSplitExpense(
        { ...input, clientMutationId },
        clientMutationId,
      );
      const key = queryKeys.splitExpenses(groupId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<{ expenses: ISplitExpense[] }>(key);
      queryClient.setQueryData<{ expenses: ISplitExpense[] }>(key, (old) => ({
        expenses: [optimistic, ...(old?.expenses ?? [])],
      }));
      return { previous, clientMutationId };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          queryKeys.splitExpenses(groupId),
          context.previous,
        );
      }
    },
  });
}

export function useCreateSplitSettlement(groupId: string) {
  return useFinMutation({
    mutationFn: (input: ICreateSplitSettlementInput) =>
      createSplitSettlement(groupId, input),
    invalidateQueries: [
      () => queryKeys.splitSettlements(groupId),
      () => queryKeys.splitBalances(groupId),
      () => queryKeys.splitSummary(),
    ],
  });
}

export function useUpdateSplitSettlement(groupId: string) {
  return useFinMutation({
    mutationFn: ({
      settlementId,
      input,
    }: {
      settlementId: string;
      input: IUpdateSplitSettlementInput;
    }) => updateSplitSettlement(groupId, settlementId, input),
    invalidateQueries: [
      () => queryKeys.splitSettlements(groupId),
      () => queryKeys.splitBalances(groupId),
      () => queryKeys.splitSummary(),
    ],
  });
}

export function useDeleteSplitSettlement(groupId: string) {
  return useFinMutation({
    mutationFn: (settlementId: string) =>
      deleteSplitSettlement(groupId, settlementId),
    invalidateQueries: [
      () => queryKeys.splitSettlements(groupId),
      () => queryKeys.splitBalances(groupId),
      () => queryKeys.splitSummary(),
    ],
  });
}

export function useRemoveSplitMember(groupId: string) {
  return useFinMutation({
    mutationFn: (memberId: string) => removeSplitMember(groupId, memberId),
    invalidateQueries: [
      () => queryKeys.splitGroup(groupId),
      () => queryKeys.splitGroups(),
      () => queryKeys.splitBalances(groupId),
      () => queryKeys.splitExpenses(groupId),
    ],
  });
}

export function useAddSplitMember(groupId: string) {
  return useFinMutation({
    mutationFn: (input: IAddSplitMemberInput) => addSplitMember(groupId, input),
    invalidateQueries: [
      () => queryKeys.splitGroup(groupId),
      () => queryKeys.splitGroups(),
      () => queryKeys.splitBalances(groupId),
    ],
  });
}

export function useUpdateSplitExpense(groupId: string) {
  return useFinMutation({
    mutationFn: ({
      expenseId,
      input,
    }: {
      expenseId: string;
      input: IUpdateSplitExpenseInput;
    }) => updateSplitExpense(groupId, expenseId, input),
    invalidateQueries: [
      () => queryKeys.splitExpenses(groupId),
      () => queryKeys.splitBalances(groupId),
      () => queryKeys.splitSummary(),
    ],
  });
}

export function useDeleteSplitExpense(groupId: string) {
  return useFinMutation({
    mutationFn: (expenseId: string) => deleteSplitExpense(groupId, expenseId),
    invalidateQueries: [
      () => queryKeys.splitExpenses(groupId),
      () => queryKeys.splitBalances(groupId),
      () => queryKeys.splitSummary(),
    ],
  });
}
