export type IPwaShortcutGo = "transactions" | "budgets" | "new-transaction";

export type IPwaShortcutDestination =
  | {
      to: "/$workspaceId";
      params: { workspaceId: string };
      search?: undefined;
    }
  | {
      to: "/$workspaceId/transactions";
      params: { workspaceId: string };
      search?: { create: true };
    }
  | {
      to: "/$workspaceId/budgets";
      params: { workspaceId: string };
      search?: undefined;
    };

/**
 * Maps a PWA home shortcut (`/?go=…`) to an in-app workspace route.
 */
export function getPwaShortcutDestination(
  workspaceId: string,
  go: string | undefined
): IPwaShortcutDestination {
  if (go === "new-transaction") {
    return {
      to: "/$workspaceId/transactions",
      params: { workspaceId },
      search: { create: true },
    };
  }
  if (go === "transactions") {
    return {
      to: "/$workspaceId/transactions",
      params: { workspaceId },
    };
  }
  if (go === "budgets") {
    return {
      to: "/$workspaceId/budgets",
      params: { workspaceId },
    };
  }
  return {
    to: "/$workspaceId",
    params: { workspaceId },
  };
}

export function parsePwaShortcutGo(value: unknown): IPwaShortcutGo | undefined {
  if (
    value === "transactions" ||
    value === "budgets" ||
    value === "new-transaction"
  ) {
    return value;
  }
  return undefined;
}
