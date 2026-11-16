import { z } from "zod";
import { CurrencySchema } from "@/features/shared/validation/enums";
import {
  DecimalStringSchema,
  ISODateStringSchema,
} from "@/features/shared/validation/primitives";
import { BANK_VALUES } from "@/features/transaction/config/banks";

export const LedgerAccountKindSchema = z.enum([
  "BANK",
  "CASH",
  "CARD",
  "SAVINGS",
]);

export const LedgerAccountSchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: LedgerAccountKindSchema,
  currency: CurrencySchema,
  openingBalance: DecimalStringSchema,
  openingBalanceDate: ISODateStringSchema.nullable().optional(),
  bank: z.enum(BANK_VALUES).nullable().optional(),
  sortOrder: z.number().int(),
  archivedAt: ISODateStringSchema.nullable().optional(),
  balance: DecimalStringSchema.optional(),
  createdAt: ISODateStringSchema,
  updatedAt: ISODateStringSchema,
});

export const CreateLedgerAccountInputSchema = z.object({
  name: z.string().min(1).max(100),
  kind: LedgerAccountKindSchema,
  currency: CurrencySchema,
  openingBalance: DecimalStringSchema.optional().default("0"),
  openingBalanceDate: ISODateStringSchema.nullable().optional(),
  bank: z.enum(BANK_VALUES).nullable().optional(),
});

export const UpdateLedgerAccountInputSchema =
  CreateLedgerAccountInputSchema.partial().extend({
    sortOrder: z.number().int().optional(),
    archivedAt: ISODateStringSchema.nullable().optional(),
  });

export const CashCountInputSchema = z.object({
  actualBalance: DecimalStringSchema,
  note: z.string().max(500).optional(),
});

export const TripSummarySchema = z.object({
  funded: DecimalStringSchema,
  withdrawn: DecimalStringSchema,
  spent: DecimalStringSchema,
  cashLeft: DecimalStringSchema,
  currency: CurrencySchema,
});

export const TripSummaryQuerySchema = z.object({
  tagIds: z.array(z.string()).optional(),
  from: ISODateStringSchema.optional(),
  to: ISODateStringSchema.optional(),
  ledgerAccountIds: z.array(z.string()).optional(),
});

export type ILedgerAccount = z.infer<typeof LedgerAccountSchema>;
export type ICreateLedgerAccountInput = z.infer<
  typeof CreateLedgerAccountInputSchema
>;
export type IUpdateLedgerAccountInput = z.infer<
  typeof UpdateLedgerAccountInputSchema
>;
export type ICashCountInput = z.infer<typeof CashCountInputSchema>;
export type ITripSummary = z.infer<typeof TripSummarySchema>;
