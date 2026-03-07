export const ROUTES = {
  ROOT: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  TRANSACTIONS: "/transactions",
  TAGS: "/tags",
  BUDGETS: "/budgets",
  SUBSCRIPTIONS: "/subscriptions",
  ACCOUNT: "/account",
  MESSAGES: "/messages",
  LOGOUT: "/logout",
} as const;

// Type for route values
export type Route = (typeof ROUTES)[keyof typeof ROUTES];
