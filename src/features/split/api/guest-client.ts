import { apiPost } from "@/features/shared/api/client";
import type {
  ICreateSplitExpenseInput,
  ICreateSplitSettlementInput,
} from "@/features/shared/validation/schemas";

export async function createGuestSplitExpense(
  token: string,
  input: ICreateSplitExpenseInput,
) {
  return apiPost<Record<string, unknown>>(`/splits/guest/${token}/expenses`, input);
}

export async function createGuestSplitSettlement(
  token: string,
  input: ICreateSplitSettlementInput,
) {
  return apiPost<Record<string, unknown>>(
    `/splits/guest/${token}/settlements`,
    input,
  );
}
