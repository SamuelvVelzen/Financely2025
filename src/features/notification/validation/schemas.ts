import { z } from "zod";
import { NotificationTypeSchema } from "@/features/shared/validation/enums";
import {
  ISODateStringSchema,
  PaginationQuerySchema,
} from "@/features/shared/validation/primitives";

export const NotificationActionSchema = z.object({
  label: z.string().min(1),
  type: z.enum(["navigate", "dismiss", "api", "custom"]),
  path: z.string().optional(),
  method: z.enum(["GET", "POST", "PATCH", "DELETE"]).optional(),
  endpoint: z.string().optional(),
  handler: z.string().optional(),
  variant: z.preprocess(
    (val) => (val === "secondary" ? "default" : val),
    z.enum(["primary", "default", "danger"]).optional(),
  ),
});

export const NotificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  content: z.string(),
  type: NotificationTypeSchema,
  actions: z.array(NotificationActionSchema).nullable(),
  read: z.boolean(),
  readAt: ISODateStringSchema.nullable(),
  relatedId: z.string().nullable(),
  relatedType: z.string().nullable(),
  createdAt: ISODateStringSchema,
  updatedAt: ISODateStringSchema,
});

export const CreateNotificationInputSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(2000),
  type: NotificationTypeSchema.default("INFO"),
  actions: z.array(NotificationActionSchema).optional(),
  relatedId: z.string().optional(),
  relatedType: z.string().optional(),
});

export const UpdateNotificationInputSchema = z.object({
  read: z.boolean().optional(),
});

export const NotificationsQuerySchema = PaginationQuerySchema.extend({
  read: z.coerce.boolean().optional(),
  type: NotificationTypeSchema.optional(),
});

export const NotificationsResponseSchema = z.object({
  data: z.array(NotificationSchema),
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  total: z.number().int().min(0),
  hasNext: z.boolean(),
});

export const UnreadCountResponseSchema = z.object({
  count: z.number().int().min(0),
});

export type INotification = z.infer<typeof NotificationSchema>;
export type INotificationAction = z.infer<typeof NotificationActionSchema>;
export type ICreateNotificationInput = z.infer<
  typeof CreateNotificationInputSchema
>;
export type IUpdateNotificationInput = z.infer<
  typeof UpdateNotificationInputSchema
>;
export type INotificationsQuery = z.infer<typeof NotificationsQuerySchema>;
export type INotificationsResponse = z.infer<
  typeof NotificationsResponseSchema
>;
export type IUnreadCountResponse = z.infer<typeof UnreadCountResponseSchema>;
