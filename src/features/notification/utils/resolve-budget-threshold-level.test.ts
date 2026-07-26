import { describe, expect, it } from "vitest";
import { resolveBudgetThresholdLevel } from "./resolve-budget-threshold-level";

describe("resolveBudgetThresholdLevel", () => {
  it("returns null under 80%", () => {
    expect(resolveBudgetThresholdLevel(0)).toBeNull();
    expect(resolveBudgetThresholdLevel(79.9)).toBeNull();
  });

  it("returns near at 80–100%", () => {
    expect(resolveBudgetThresholdLevel(80)).toBe("near");
    expect(resolveBudgetThresholdLevel(100)).toBe("near");
  });

  it("returns over above 100%", () => {
    expect(resolveBudgetThresholdLevel(100.01)).toBe("over");
    expect(resolveBudgetThresholdLevel(150)).toBe("over");
  });
});
