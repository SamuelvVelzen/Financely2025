import type { ICreateTransactionInput, IUpdateTransactionInput } from "@/features/transaction/validation/schemas";

export function validateTransferShape(
  type: string,
  transferDirection: string | null | undefined,
): void {
  if (type === "TRANSFER") {
    if (transferDirection !== "OUT" && transferDirection !== "IN") {
      throw new Error("Transfer transactions require transferDirection OUT or IN");
    }
    return;
  }
  if (transferDirection != null) {
    throw new Error("transferDirection is only allowed for TRANSFER transactions");
  }
}

export function assertCreateTransferFields(input: ICreateTransactionInput): void {
  validateTransferShape(input.type, input.transferDirection ?? null);
}

export function assertUpdateTransferFields(
  existingType: string,
  existingDirection: string | null,
  input: IUpdateTransactionInput,
): void {
  const nextType = input.type ?? existingType;
  const nextDirection =
    input.transferDirection !== undefined
      ? input.transferDirection
      : existingDirection;
  validateTransferShape(nextType, nextDirection);
}

export function isSpendingTransactionType(type: string): boolean {
  return type === "EXPENSE" || type === "INCOME";
}
