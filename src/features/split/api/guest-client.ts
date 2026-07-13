import { apiPost } from "@/features/shared/api/client";
import type { ICreateSplitExpenseInput } from "@/features/shared/validation/schemas";

export async function createGuestSplitExpense(
  token: string,
  input: ICreateSplitExpenseInput,
) {
  return apiPost<Record<string, unknown>>(`/splits/guest/${token}/expenses`, input);
}
