/**
 * Query Keys
 * Centralized, stable, and serializable query keys for TanStack Query
 *
 * Rules:
 * - Never include functions, class instances, or Date objects
 * - Convert Dates to ISO strings
 * - All keys should be serializable
 */

export const queryKeys = {
  // User queries
  me: () => ["me"] as const,

  // Tag queries
  tags: (params?: { q?: string; sort?: "name:asc" | "name:desc" }) =>
    ["tags", params] as const,

  // Transaction queries
  transactions: (params?: {
    page?: number;
    limit?: number;
    from?: string; // ISO date string
    to?: string; // ISO date string
    type?: "INCOME" | "EXPENSE";
    tagIds?: string[];
    q?: string;
    sort?: string; // e.g., "occurredAt:desc"
  }) => ["transactions", params] as const,

  // Expense queries (transactions with type EXPENSE)
  expenses: (params?: {
    page?: number;
    limit?: number;
    from?: string; // ISO date string
    to?: string; // ISO date string
    tagIds?: string[];
    q?: string;
    sort?: string; // e.g., "occurredAt:desc"
  }) => ["expenses", params] as const,

  // Income queries (transactions with type INCOME)
  incomes: (params?: {
    page?: number;
    limit?: number;
    from?: string; // ISO date string
    to?: string; // ISO date string
    tagIds?: string[];
    q?: string;
    sort?: string; // e.g., "occurredAt:desc"
  }) => ["incomes", params] as const,
} as const;
