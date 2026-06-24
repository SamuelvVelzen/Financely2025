import type { ICreateTagRuleWithTagInput } from "@/features/shared/validation/schemas";

export type IPendingTagRule = ICreateTagRuleWithTagInput & {
  clientId: string;
};
