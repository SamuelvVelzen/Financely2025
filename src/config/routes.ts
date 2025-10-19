export const ROUTES = {
  ROOT: "/",
  INCOMES: "/incomes",
  EXPENSES: "/expenses",
  LABELS: "/labels",
  ACCOUNT: "/account",
  LOGOUT: "/logout",
} as const;

// Type for route values
export type Route = typeof ROUTES[keyof typeof ROUTES];
