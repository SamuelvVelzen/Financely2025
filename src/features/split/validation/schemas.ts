import { CurrencySchema } from "@/features/shared/validation/enums";
import {
  DateStringSchema,
  DecimalStringSchema,
} from "@/features/shared/validation/primitives";
import { z } from "zod";

export const SplitMemberStatusSchema = z.enum([
  "pending",
  "guest",
  "linked",
  "removed",
]);

export const CreateSplitGroupInputSchema = z.object({
  name: z.string().min(1).max(100),
  defaultCurrency: CurrencySchema,
});

export const UpdateSplitGroupInputSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  defaultCurrency: CurrencySchema.optional(),
  guestCanView: z.boolean().optional(),
  guestCanAdd: z.boolean().optional(),
  guestCanSettle: z.boolean().optional(),
  guestCanEditOwn: z.boolean().optional(),
});

export const AddSplitMemberInputSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1).max(100).optional(),
});

export const ExactShareInputSchema = z.object({
  memberId: z.string().min(1),
  shareAmount: DecimalStringSchema,
});

export const CreateSplitExpenseInputSchema = z.object({
  description: z.string().min(1).max(200),
  amount: DecimalStringSchema,
  currency: CurrencySchema,
  expenseDate: DateStringSchema,
  paidByMemberId: z.string().min(1),
  participantMemberIds: z.array(z.string().min(1)).min(1),
  splitMode: z.enum(["equal", "exact"]).default("equal"),
  exactShares: z.array(ExactShareInputSchema).optional(),
  clientMutationId: z.string().uuid().optional(),
});

export const UpdateSplitExpenseInputSchema = z.object({
  description: z.string().min(1).max(200).optional(),
  amount: DecimalStringSchema.optional(),
  currency: CurrencySchema.optional(),
  expenseDate: DateStringSchema.optional(),
  paidByMemberId: z.string().min(1).optional(),
  participantMemberIds: z.array(z.string().min(1)).min(1).optional(),
  splitMode: z.enum(["equal", "exact"]).optional(),
  exactShares: z.array(ExactShareInputSchema).optional(),
});

export const CreateSplitSettlementInputSchema = z.object({
  fromMemberId: z.string().min(1),
  toMemberId: z.string().min(1),
  amount: DecimalStringSchema,
  settledAt: DateStringSchema,
  note: z.string().max(500).optional(),
}).refine((data) => data.fromMemberId !== data.toMemberId, {
  message: "Payer and recipient must be different people",
  path: ["toMemberId"],
});

export const UpdateSplitSettlementInputSchema = z
  .object({
    fromMemberId: z.string().min(1).optional(),
    toMemberId: z.string().min(1).optional(),
    amount: DecimalStringSchema.optional(),
    settledAt: DateStringSchema.optional(),
    note: z.string().max(500).nullable().optional(),
  })
  .refine(
    (data) =>
      data.fromMemberId == null ||
      data.toMemberId == null ||
      data.fromMemberId !== data.toMemberId,
    {
      message: "Payer and recipient must be different people",
      path: ["toMemberId"],
    },
  );

export const GuestJoinInputSchema = z.object({
  displayName: z.string().min(1).max(100),
});

export const SplitGroupListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  defaultCurrency: z.string(),
  memberCount: z.number(),
  expenseCount: z.number(),
  role: z.string(),
  isCreator: z.boolean(),
  joinedAt: z.string(),
  viewerNetAmount: z.string(),
});

export const SplitBalancesSchema = z.object({
  currency: z.string(),
  memberBalances: z.array(
    z.object({
      memberId: z.string(),
      displayName: z.string(),
      netAmount: z.string(),
    }),
  ),
  simplifiedDebts: z.array(
    z.object({
      fromMemberId: z.string(),
      fromDisplayName: z.string(),
      toMemberId: z.string(),
      toDisplayName: z.string(),
      amount: z.string(),
    }),
  ),
  viewerNetAmount: z.string().optional(),
});

export type ICreateSplitGroupInput = z.infer<typeof CreateSplitGroupInputSchema>;
export type IUpdateSplitGroupInput = z.infer<typeof UpdateSplitGroupInputSchema>;
export type IAddSplitMemberInput = z.infer<typeof AddSplitMemberInputSchema>;
export type ICreateSplitExpenseInput = z.infer<
  typeof CreateSplitExpenseInputSchema
>;
export type IUpdateSplitExpenseInput = z.infer<
  typeof UpdateSplitExpenseInputSchema
>;
export type ICreateSplitSettlementInput = z.infer<
  typeof CreateSplitSettlementInputSchema
>;
export type IUpdateSplitSettlementInput = z.infer<
  typeof UpdateSplitSettlementInputSchema
>;
