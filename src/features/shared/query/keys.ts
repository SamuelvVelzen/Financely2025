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
  myProfile: () => ["me", "profile"] as const,
  myAccounts: () => ["me", "accounts"] as const,

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

  // Message queries
  messages: (params?: {
    page?: number;
    limit?: number;
    read?: boolean;
    type?: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  }) => ["messages", params] as const,
  message: (messageId: string) => ["messages", messageId] as const,
  unreadCount: () => ["messages", "unread-count"] as const,

  // Budget queries
  budgets: (params?: {
    from?: string; // ISO date string
    to?: string; // ISO date string
  }) => ["budgets", params] as const,
  budget: (budgetId: string) => ["budgets", budgetId] as const,
  budgetComparison: (budgetId: string) =>
    ["budgets", budgetId, "comparison"] as const,
  budgetsOverview: () => ["budgets", "overview"] as const,
} as const;
