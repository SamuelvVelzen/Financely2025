/**
 * Query Keys
 * Centralized, stable, and serializable query keys for TanStack Query
 *
 * Rules:
 * - Never include functions, class instances, or Date objects
 * - Convert Dates to ISO strings
 * - All keys should be serializable
 * - Workspace id is included for workspace-scoped domain caches
 */

export const queryKeys = {
  // User queries
  me: () => ["me"] as const,
  myProfile: () => ["me", "profile"] as const,
  myAccounts: () => ["me", "accounts"] as const,

  // Tag queries
  tags: (
    workspaceId: number,
    params?: { q?: string; sort?: "name:asc" | "name:desc" },
  ) => ["tags", workspaceId, params] as const,

  // Transaction queries
  transactions: (
    workspaceId: number,
    params?: {
      page?: number;
      limit?: number;
      from?: string;
      to?: string;
      type?: "INCOME" | "EXPENSE";
      tagIds?: string[];
      q?: string;
      sort?: string;
    },
  ) => ["transactions", workspaceId, params] as const,

  expenses: (
    workspaceId: number,
    params?: {
      page?: number;
      limit?: number;
      from?: string;
      to?: string;
      tagIds?: string[];
      q?: string;
      sort?: string;
    },
  ) => ["expenses", workspaceId, params] as const,

  incomes: (
    workspaceId: number,
    params?: {
      page?: number;
      limit?: number;
      from?: string;
      to?: string;
      tagIds?: string[];
      q?: string;
      sort?: string;
    },
  ) => ["incomes", workspaceId, params] as const,

  messages: (
    workspaceId: number,
    params?: {
      page?: number;
      limit?: number;
      read?: boolean;
      type?: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
    },
  ) => ["messages", workspaceId, params] as const,
  message: (workspaceId: number, messageId: string) =>
    ["messages", workspaceId, messageId] as const,
  unreadCount: (workspaceId: number) =>
    ["messages", workspaceId, "unread-count"] as const,

  budgets: (
    workspaceId: number,
    params?: {
      from?: string;
      to?: string;
    },
  ) => ["budgets", workspaceId, params] as const,
  budget: (workspaceId: number, budgetId: string) =>
    ["budgets", workspaceId, budgetId] as const,
  budgetComparison: (workspaceId: number, budgetId: string) =>
    ["budgets", workspaceId, budgetId, "comparison"] as const,
  budgetsOverview: (workspaceId: number) =>
    ["budgets", workspaceId, "overview"] as const,

  subscriptions: (workspaceId: number, params?: { active?: boolean }) =>
    ["subscriptions", workspaceId, params] as const,
  subscription: (workspaceId: number, subscriptionId: string) =>
    ["subscriptions", workspaceId, subscriptionId] as const,
  subscriptionCandidates: (workspaceId: number) =>
    ["subscriptions", workspaceId, "candidates"] as const,
  subscriptionDismissals: (workspaceId: number) =>
    ["subscriptions", workspaceId, "dismissals"] as const,

  wizardProgress: () => ["wizard", "progress"] as const,
  wizardProgressById: (wizardId: string) =>
    ["wizard", "progress", wizardId] as const,
} as const;
