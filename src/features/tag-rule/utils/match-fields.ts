import type { ITransactionType } from "@/features/shared/validation/schemas";
import type { ITagRuleMatchField } from "@/features/tag-rule/validation/schemas";
import { PAYMENT_METHOD_LABELS } from "@/features/transaction/config/payment-methods";

export const TAG_RULE_MATCH_FIELD_VALUES = [
  "NAME",
  "DESCRIPTION",
  "NOTES",
  "PAYMENT_METHOD",
  "TRANSACTION_TYPE",
] as const satisfies readonly ITagRuleMatchField[];

export const TAG_RULE_MATCH_FIELD_LABELS: Record<ITagRuleMatchField, string> = {
  NAME: "Transaction name",
  DESCRIPTION: "Description",
  NOTES: "Notes",
  PAYMENT_METHOD: "Payment method",
  TRANSACTION_TYPE: "Transaction type",
};

export const TAG_RULE_MATCH_FIELD_OPTIONS = TAG_RULE_MATCH_FIELD_VALUES.map(
  (value) => ({
    value,
    label: TAG_RULE_MATCH_FIELD_LABELS[value],
  })
);

export type ITagRuleMatchContext = {
  name: string;
  description?: string | null;
  notes?: string | null;
  paymentMethod?: string | null;
  type?: ITransactionType;
};

export function parseMatchFields(
  matchFieldsJson: string
): ITagRuleMatchField[] {
  try {
    const parsed = JSON.parse(matchFieldsJson);
    if (!Array.isArray(parsed)) {
      return ["NAME"];
    }

    const allowed = new Set<string>(TAG_RULE_MATCH_FIELD_VALUES);
    const fields = parsed.filter(
      (field): field is ITagRuleMatchField =>
        typeof field === "string" && allowed.has(field)
    );

    return fields.length > 0 ? fields : ["NAME"];
  } catch {
    return ["NAME"];
  }
}

export function serializeMatchFields(
  matchFields: ITagRuleMatchField[]
): string {
  return JSON.stringify(matchFields);
}

function getMatchFieldValue(
  field: ITagRuleMatchField,
  context: ITagRuleMatchContext
): string {
  switch (field) {
    case "NAME":
      return context.name;
    case "DESCRIPTION":
      return context.description ?? "";
    case "NOTES":
      return context.notes ?? "";
    case "PAYMENT_METHOD": {
      if (!context.paymentMethod) {
        return "";
      }
      return (
        PAYMENT_METHOD_LABELS[
          context.paymentMethod as keyof typeof PAYMENT_METHOD_LABELS
        ] ?? context.paymentMethod
      );
    }
    case "TRANSACTION_TYPE":
      if (!context.type) {
        return "";
      }
      return context.type === "EXPENSE" ? "Expense" : "Income";
    default:
      return "";
  }
}

export function buildMatchHaystack(
  matchFields: ITagRuleMatchField[],
  context: ITagRuleMatchContext
): string {
  return matchFields
    .map((field) => getMatchFieldValue(field, context))
    .filter((value) => value.length > 0)
    .join(" ");
}
