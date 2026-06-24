import { z } from "zod";
import { ISODateStringSchema } from "@/features/shared/validation/primitives";
import { WorkspaceSummarySchema } from "@/features/workspace/validation/schemas";

export function formatFullName(
  firstName?: string | null,
  lastName?: string | null,
  suffix?: string | null,
): string | null {
  const parts: string[] = [];

  if (firstName) {
    parts.push(firstName);
  }

  if (lastName) {
    parts.push(lastName);
  }

  if (suffix) {
    parts.push(suffix);
  }

  return parts.length > 0 ? parts.join(" ") : null;
}

export const UserSchema = z.object({
  id: z.string(),
  createdAt: ISODateStringSchema,
  updatedAt: ISODateStringSchema,
});

export const ThemeSchema = z.enum(["light", "dark", "system"]);

export const UserSettingSchema = z.object({
  id: z.string(),
  defaultLanguage: z.string().nullable(),
  defaultWorkspaceId: z.number().int().nullable(),
  theme: ThemeSchema.nullable(),
  createdAt: ISODateStringSchema,
  updatedAt: ISODateStringSchema,
});

export const UpdateUserSettingInputSchema = z.object({
  defaultLanguage: z.string().nullable().optional(),
  defaultWorkspaceId: z.number().int().nullable().optional(),
  theme: ThemeSchema.nullable().optional(),
});

export const UserResponseSchema = UserSchema.extend({
  email: z.string().email(),
  name: z.string(),
  workspaces: z.array(WorkspaceSummarySchema),
});

export const UserProfileSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  emailVerified: z.boolean(),
  firstName: z.string(),
  lastName: z.string(),
  suffix: z.string().nullable(),
  name: z.string(),
  image: z.string().nullable(),
  createdAt: ISODateStringSchema,
  updatedAt: ISODateStringSchema,
});

export const UserProfileResponseSchema = UserProfileSchema;

export const UpdateUserProfileInputSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  suffix: z.string().max(20).nullable().optional(),
});

export const ConnectedAccountSchema = z.object({
  id: z.string(),
  providerId: z.string(),
  createdAt: z.string().datetime(),
});

export const ConnectedAccountsResponseSchema = z.object({
  accounts: z.array(ConnectedAccountSchema),
  hasPassword: z.boolean(),
});

export const ChangePasswordInputSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const ChangeEmailInputSchema = z.object({
  newEmail: z.string().email("Invalid email address"),
});

export type IUser = z.infer<typeof UserSchema>;
export type ITheme = z.infer<typeof ThemeSchema>;
export type IUserSetting = z.infer<typeof UserSettingSchema>;
export type IUpdateUserSettingInput = z.infer<
  typeof UpdateUserSettingInputSchema
>;
export type IUserResponse = z.infer<typeof UserResponseSchema>;
export type IUserProfile = z.infer<typeof UserProfileSchema>;
export type IUpdateUserProfileInput = z.infer<
  typeof UpdateUserProfileInputSchema
>;
export type IConnectedAccount = z.infer<typeof ConnectedAccountSchema>;
export type IConnectedAccountsResponse = z.infer<
  typeof ConnectedAccountsResponseSchema
>;
export type IChangePasswordInput = z.infer<typeof ChangePasswordInputSchema>;
export type IChangeEmailInput = z.infer<typeof ChangeEmailInputSchema>;
