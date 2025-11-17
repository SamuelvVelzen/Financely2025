/**
 * Transaction field configuration
 * Defines system-required fields and field metadata for CSV import
 */

export const SYSTEM_REQUIRED_FIELDS = [
  "type",
  "amount",
  "currency",
  "occurredAt",
  "name",
] as const;

export type ITransactionFieldName =
  | "type"
  | "amount"
  | "currency"
  | "occurredAt"
  | "name"
  | "description"
  | "notes"
  | "externalId"
  | "tags";

export interface ITransactionFieldMetadata {
  name: ITransactionFieldName;
  label: string;
  required: boolean;
  type: "string" | "number" | "date" | "enum" | "array";
  description?: string;
}

export const TRANSACTION_FIELDS: ITransactionFieldMetadata[] = [
  {
    name: "type",
    label: "Type",
    required: true,
    type: "enum",
    description: "Transaction type (EXPENSE or INCOME)",
  },
  {
    name: "amount",
    label: "Amount",
    required: true,
    type: "number",
    description: "Transaction amount (decimal number)",
  },
  {
    name: "currency",
    label: "Currency",
    required: true,
    type: "enum",
    description: "Currency code (USD, EUR, GBP, CAD, AUD, JPY)",
  },
  {
    name: "occurredAt",
    label: "Date",
    required: true,
    type: "date",
    description: "Transaction date (ISO 8601 format)",
  },
  {
    name: "name",
    label: "Name",
    required: true,
    type: "string",
    description: "Transaction name/title",
  },
  {
    name: "description",
    label: "Description",
    required: false,
    type: "string",
    description: "Transaction description",
  },
  {
    name: "notes",
    label: "Notes",
    required: false,
    type: "string",
    description: "Additional notes",
  },
  {
    name: "externalId",
    label: "External ID",
    required: false,
    type: "string",
    description: "External reference ID",
  },
  {
    name: "tags",
    label: "Tags",
    required: false,
    type: "array",
    description: "Comma-separated tag names",
  },
];

export function getFieldMetadata(
  fieldName: ITransactionFieldName
): ITransactionFieldMetadata | undefined {
  return TRANSACTION_FIELDS.find((field) => field.name === fieldName);
}

export function isRequiredField(fieldName: ITransactionFieldName): boolean {
  return SYSTEM_REQUIRED_FIELDS.includes(fieldName as any);
}

