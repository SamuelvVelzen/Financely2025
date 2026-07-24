import { z } from "zod";
import { NotificationTypeSchema } from "@/features/shared/validation/enums";

/**
 * Zod schema for notification filter query parameters.
 * Used with TanStack Router's validateSearch.
 */
export const notificationStatusFilterSchema = z.enum([
  "all",
  "unread",
  "read",
]);

export const notificationFilterQuerySchema = z.object({
  status: notificationStatusFilterSchema.optional(),
  type: NotificationTypeSchema.optional(),
});

export type INotificationStatusFilter = z.infer<
  typeof notificationStatusFilterSchema
>;
export type INotificationFilterQueryParams = z.infer<
  typeof notificationFilterQuerySchema
>;
