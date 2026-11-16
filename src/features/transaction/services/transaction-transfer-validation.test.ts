import { describe, expect, it } from "vitest";
import { validateTransferShape } from "./transaction-transfer-validation";

describe("validateTransferShape", () => {
  it("requires direction for TRANSFER", () => {
    expect(() => validateTransferShape("TRANSFER", null)).toThrow();
    expect(() => validateTransferShape("TRANSFER", "OUT")).not.toThrow();
  });

  it("forbids direction on EXPENSE", () => {
    expect(() => validateTransferShape("EXPENSE", "OUT")).toThrow();
  });
});
