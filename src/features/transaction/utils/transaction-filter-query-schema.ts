import { z } from "zod";

/**
 * Zod schema for transaction filter query parameters
 * Used with TanStack Router's validateSearch
 */
export const transactionFilterQuerySchema = z.object({
  // Search query - using 'q' to match API convention
  q: z.string().optional(),
  
  // Date filter
  dateType: z.enum(["allTime", "thisMonth", "lastMonth", "custom"]).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  
  // Price filter
  priceMin: z.string().regex(/^-?\d+\.?\d*$/).optional(),
  priceMax: z.string().regex(/^-?\d+\.?\d*$/).optional(),
  
  // Tag filter - comma-separated tag IDs
  tags: z.string().optional(),
  
  // Transaction type filter - comma-separated: "EXPENSE" | "INCOME"
  transactionTypes: z.string().optional(),
  
  // Payment method filter - comma-separated payment method values
  paymentMethods: z.string().optional(),
  
  // Currency filter - comma-separated currency codes
  currencies: z.string().optional(),
});

export type ITransactionFilterQueryParams = z.infer<
  typeof transactionFilterQuerySchema
>;

