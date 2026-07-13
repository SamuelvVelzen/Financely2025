import { apiDelete, apiGet, apiPatch, apiPost } from "@/features/shared/api/client";
import type {
  ICreateSplitExpenseInput,
  ICreateSplitGroupInput,
  ICreateSplitSettlementInput,
  IUpdateSplitExpenseInput,
  IUpdateSplitGroupInput,
  IUpdateSplitSettlementInput,
  IAddSplitMemberInput,
} from "@/features/shared/validation/schemas";

const BASE = "/me/splits";

export async function getSplitGroups() {
  return apiGet<{ groups: Array<Record<string, unknown>> }>(`${BASE}/groups`);
}

export async function getSplitSummary() {
  return apiGet<{
    groups: Array<{
      groupId: string;
      groupName: string;
      currency: string;
      netAmount: string;
    }>;
  }>(`${BASE}/summary`);
}

export async function createSplitGroup(input: ICreateSplitGroupInput) {
  return apiPost<Record<string, unknown>>(`${BASE}/groups`, input);
}

export async function getSplitGroup(groupId: string) {
  return apiGet<Record<string, unknown>>(`${BASE}/groups/${groupId}`);
}

export async function updateSplitGroup(
  groupId: string,
  input: IUpdateSplitGroupInput,
) {
  return apiPatch<Record<string, unknown>>(`${BASE}/groups/${groupId}`, input);
}

export async function deleteSplitGroup(groupId: string) {
  return apiDelete<{ success: boolean }>(`${BASE}/groups/${groupId}`);
}

export async function addSplitMember(
  groupId: string,
  input: IAddSplitMemberInput,
) {
  return apiPost<Record<string, unknown>>(
    `${BASE}/groups/${groupId}/members`,
    input,
  );
}

export async function removeSplitMember(groupId: string, memberId: string) {
  return apiDelete<{ success: boolean }>(
    `${BASE}/groups/${groupId}/members/${memberId}`,
  );
}

export async function getSplitExpenses(groupId: string) {
  return apiGet<{ expenses: Array<Record<string, unknown>> }>(
    `${BASE}/groups/${groupId}/expenses`,
  );
}

export async function createSplitExpense(
  groupId: string,
  input: ICreateSplitExpenseInput,
) {
  return apiPost<Record<string, unknown>>(
    `${BASE}/groups/${groupId}/expenses`,
    input,
  );
}

export async function updateSplitExpense(
  groupId: string,
  expenseId: string,
  input: IUpdateSplitExpenseInput,
) {
  return apiPatch<Record<string, unknown>>(
    `${BASE}/groups/${groupId}/expenses/${expenseId}`,
    input,
  );
}

export async function deleteSplitExpense(groupId: string, expenseId: string) {
  return apiDelete<{ success: boolean }>(
    `${BASE}/groups/${groupId}/expenses/${expenseId}`,
  );
}

export async function getSplitBalances(groupId: string) {
  return apiGet<Record<string, unknown>>(`${BASE}/groups/${groupId}/balances`);
}

export async function getSplitSettlements(groupId: string) {
  return apiGet<{ settlements: Array<Record<string, unknown>> }>(
    `${BASE}/groups/${groupId}/settlements`,
  );
}

export async function createSplitSettlement(
  groupId: string,
  input: ICreateSplitSettlementInput,
) {
  return apiPost<Record<string, unknown>>(
    `${BASE}/groups/${groupId}/settlements`,
    input,
  );
}

export async function updateSplitSettlement(
  groupId: string,
  settlementId: string,
  input: IUpdateSplitSettlementInput,
) {
  return apiPatch<Record<string, unknown>>(
    `${BASE}/groups/${groupId}/settlements/${settlementId}`,
    input,
  );
}

export async function deleteSplitSettlement(
  groupId: string,
  settlementId: string,
) {
  return apiDelete<{ success: boolean }>(
    `${BASE}/groups/${groupId}/settlements/${settlementId}`,
  );
}

export async function rotateGuestLink(groupId: string) {
  return apiPost<{ guestAccessToken: string }>(
    `${BASE}/groups/${groupId}/guest-link/rotate`,
    {},
  );
}

export async function convertPendingExpenses(groupId: string) {
  return apiPost<{ converted: number }>(
    `${BASE}/groups/${groupId}/convert-pending`,
    {},
  );
}
