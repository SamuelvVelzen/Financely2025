import { z } from "zod";
import { CurrencySchema } from "@/features/shared/validation/enums";
import { ISODateStringSchema } from "@/features/shared/validation/primitives";

export const WorkspaceSummarySchema = z.object({
  id: z.number().int(),
  name: z.string(),
  createdAt: ISODateStringSchema,
  updatedAt: ISODateStringSchema,
});

export const CreateWorkspaceBodySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
});

export const RenameWorkspaceBodySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
});

export const WorkspaceSettingSchema = z.object({
  workspaceId: z.number().int(),
  defaultCurrency: CurrencySchema.nullable(),
  smartTaggingEnabled: z.boolean(),
  historyLearningEnabled: z.boolean(),
  createdAt: ISODateStringSchema,
  updatedAt: ISODateStringSchema,
});

export const UpdateWorkspaceSettingInputSchema = z.object({
  defaultCurrency: CurrencySchema.nullable().optional(),
  smartTaggingEnabled: z.boolean().optional(),
  historyLearningEnabled: z.boolean().optional(),
});

export type IWorkspaceSummary = z.infer<typeof WorkspaceSummarySchema>;
export type IWorkspaceSetting = z.infer<typeof WorkspaceSettingSchema>;
export type IUpdateWorkspaceSettingInput = z.infer<
  typeof UpdateWorkspaceSettingInputSchema
>;
