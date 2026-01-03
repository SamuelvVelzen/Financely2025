import { z } from "zod";

/**
 * Zod schema for tag filter query parameters
 * Used with TanStack Router's validateSearch
 */
export const tagFilterQuerySchema = z.object({
  // Search query - using 'q' to match API convention
  q: z.string().optional(),
});

export type ITagFilterQueryParams = z.infer<typeof tagFilterQuerySchema>;

