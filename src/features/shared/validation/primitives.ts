import { z } from "zod";

export const ISODateStringSchema = z.string().datetime();

export const DateStringSchema = z
  .string()
  .transform((val) => {
    if (val.includes("T")) {
      const date = new Date(val);
      if (isNaN(date.getTime())) {
        throw new Error("Invalid ISO datetime format");
      }
      return val;
    }
    const match = val.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
      throw new Error(
        "Invalid date format. Expected YYYY-MM-DD or ISO datetime",
      );
    }
    const [, year, month, day] = match.map(Number);
    const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    if (isNaN(date.getTime())) {
      throw new Error("Invalid date");
    }
    return date.toISOString();
  })
  .pipe(z.string().datetime());

export const DecimalStringSchema = z
  .string()
  .regex(/^-?\d+\.?\d*$/, "Must be a valid decimal number");

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const SortQuerySchema = z.object({
  sort: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        const [field, direction] = val.split(":");
        return (
          ["occurredAt", "amount", "name"].includes(field) &&
          ["asc", "desc"].includes(direction)
        );
      },
      { message: "Sort format: field:asc|desc (e.g., occurredAt:desc)" },
    )
    .optional(),
});
