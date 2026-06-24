import { z } from "zod";
import { MessageTypeSchema } from "@/features/shared/validation/enums";
import {
  ISODateStringSchema,
  PaginationQuerySchema,
} from "@/features/shared/validation/primitives";

export const MessageActionSchema = z.object({
  label: z.string().min(1),
  type: z.enum(["navigate", "dismiss", "api", "custom"]),
  path: z.string().optional(),
  method: z.enum(["GET", "POST", "PATCH", "DELETE"]).optional(),
  endpoint: z.string().optional(),
  handler: z.string().optional(),
  variant: z.enum(["primary", "secondary", "danger"]).optional(),
});

export const MessageSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  content: z.string(),
  type: MessageTypeSchema,
  actions: z.array(MessageActionSchema).nullable(),
  read: z.boolean(),
  readAt: ISODateStringSchema.nullable(),
  relatedId: z.string().nullable(),
  relatedType: z.string().nullable(),
  createdAt: ISODateStringSchema,
  updatedAt: ISODateStringSchema,
});

export const CreateMessageInputSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(2000),
  type: MessageTypeSchema.default("INFO"),
  actions: z.array(MessageActionSchema).optional(),
  relatedId: z.string().optional(),
  relatedType: z.string().optional(),
});

export const UpdateMessageInputSchema = z.object({
  read: z.boolean().optional(),
});

export const MessagesQuerySchema = PaginationQuerySchema.extend({
  read: z.coerce.boolean().optional(),
  type: MessageTypeSchema.optional(),
});

export const MessagesResponseSchema = z.object({
  data: z.array(MessageSchema),
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  total: z.number().int().min(0),
  hasNext: z.boolean(),
});

export const UnreadCountResponseSchema = z.object({
  count: z.number().int().min(0),
});

export type IMessage = z.infer<typeof MessageSchema>;
export type IMessageAction = z.infer<typeof MessageActionSchema>;
export type ICreateMessageInput = z.infer<typeof CreateMessageInputSchema>;
export type IUpdateMessageInput = z.infer<typeof UpdateMessageInputSchema>;
export type IMessagesQuery = z.infer<typeof MessagesQuerySchema>;
export type IMessagesResponse = z.infer<typeof MessagesResponseSchema>;
export type IUnreadCountResponse = z.infer<typeof UnreadCountResponseSchema>;
