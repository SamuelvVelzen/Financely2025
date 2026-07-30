import { describe, expect, it } from "vitest";
import {
  getPwaShortcutDestination,
  parsePwaShortcutGo,
} from "./pwa-shortcut-destination";

describe("parsePwaShortcutGo", () => {
  it("accepts known shortcut targets", () => {
    expect(parsePwaShortcutGo("transactions")).toBe("transactions");
    expect(parsePwaShortcutGo("budgets")).toBe("budgets");
    expect(parsePwaShortcutGo("new-transaction")).toBe("new-transaction");
  });

  it("rejects unknown values", () => {
    expect(parsePwaShortcutGo("splits")).toBeUndefined();
    expect(parsePwaShortcutGo(1)).toBeUndefined();
  });
});

describe("getPwaShortcutDestination", () => {
  it("routes transactions and budgets shortcuts", () => {
    expect(getPwaShortcutDestination("3", "transactions")).toEqual({
      to: "/$workspaceId/transactions",
      params: { workspaceId: "3" },
    });
    expect(getPwaShortcutDestination("3", "budgets")).toEqual({
      to: "/$workspaceId/budgets",
      params: { workspaceId: "3" },
    });
  });

  it("routes new-transaction to transactions with create search", () => {
    expect(getPwaShortcutDestination("3", "new-transaction")).toEqual({
      to: "/$workspaceId/transactions",
      params: { workspaceId: "3" },
      search: { create: true },
    });
  });

  it("falls back to workspace home", () => {
    expect(getPwaShortcutDestination("3", undefined)).toEqual({
      to: "/$workspaceId",
      params: { workspaceId: "3" },
    });
  });
});
