export const ROUTES = {
  ROOT: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  INCOMES: "/incomes",
  EXPENSES: "/expenses",
  TAGS: "/tags",
  ACCOUNT: "/account",
  LOGOUT: "/logout",
} as const;

// Type for route values
export type Route = (typeof ROUTES)[keyof typeof ROUTES];
