import { describe, expect, it } from "vitest";
import {
  applyIdRemapsToEndpoint,
  applyIdRemapsToValue,
} from "./offline-id-remap-utils";

describe("applyIdRemapsToValue", () => {
  it("rewrites matching string ids in nested bodies", () => {
    const remaps = new Map([
      ["temp-tag", "server-tag"],
      ["temp-tx", "server-tx"],
    ]);
    expect(
      applyIdRemapsToValue(
        {
          primaryTagId: "temp-tag",
          tagIds: ["temp-tag", "other"],
          nested: { transactionId: "temp-tx" },
        },
        remaps,
      ),
    ).toEqual({
      primaryTagId: "server-tag",
      tagIds: ["server-tag", "other"],
      nested: { transactionId: "server-tx" },
    });
  });
});

describe("applyIdRemapsToEndpoint", () => {
  it("rewrites client ids embedded in path segments", () => {
    const remaps = new Map([
      ["temp-group", "server-group"],
      ["temp-expense", "server-expense"],
    ]);
    expect(
      applyIdRemapsToEndpoint(
        "/me/splits/groups/temp-group/expenses/temp-expense",
        remaps,
      ),
    ).toBe("/me/splits/groups/server-group/expenses/server-expense");
  });

  it("leaves unrelated paths unchanged", () => {
    const remaps = new Map([["temp-a", "server-a"]]);
    expect(applyIdRemapsToEndpoint("/1/transactions", remaps)).toBe(
      "/1/transactions",
    );
  });
});
