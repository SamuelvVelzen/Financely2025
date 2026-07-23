import { describe, expect, it } from "vitest";
import {
  computeEqualShares,
  computeExactShares,
  computePercentShares,
  computeWeightedShares,
} from "@/features/split/utils/split-share-calculator";
import { simplifyDebts } from "@/features/split/utils/simplify-debts";

describe("split-share-calculator", () => {
  it("splits equally with remainder to payer", () => {
    const shares = computeEqualShares("10.00", "USD", ["a", "b", "c"], "a");
    const total = shares.reduce((s, x) => s + parseFloat(x.shareAmount), 0);
    expect(total).toBeCloseTo(10, 2);
    const payerShare = shares.find((s) => s.memberId === "a")!;
    expect(parseFloat(payerShare.shareAmount)).toBeCloseTo(3.34, 2);
  });

  it("validates exact shares sum", () => {
    expect(() =>
      computeExactShares("10.00", "USD", [
        { memberId: "a", shareAmount: "5.00" },
        { memberId: "b", shareAmount: "4.00" },
      ]),
    ).toThrow();
  });

  it("accepts exact shares that sum correctly", () => {
    const shares = computeExactShares("10.00", "USD", [
      { memberId: "a", shareAmount: "6.00" },
      { memberId: "b", shareAmount: "4.00" },
    ]);
    expect(shares).toHaveLength(2);
  });

  it("splits by percentage with remainder to payer", () => {
    const shares = computePercentShares(
      "100.00",
      "USD",
      [
        { memberId: "a", shareAmount: "50" },
        { memberId: "b", shareAmount: "30" },
        { memberId: "c", shareAmount: "20" },
      ],
      "a",
    );
    expect(shares).toEqual([
      { memberId: "a", shareAmount: "50.00" },
      { memberId: "b", shareAmount: "30.00" },
      { memberId: "c", shareAmount: "20.00" },
    ]);
  });

  it("rejects percentages that do not sum to 100", () => {
    expect(() =>
      computePercentShares(
        "100.00",
        "USD",
        [
          { memberId: "a", shareAmount: "60" },
          { memberId: "b", shareAmount: "30" },
        ],
        "a",
      ),
    ).toThrow();
  });

  it("splits by share weights", () => {
    const shares = computeWeightedShares(
      "90.00",
      "USD",
      [
        { memberId: "a", shareAmount: "2" },
        { memberId: "b", shareAmount: "1" },
      ],
      "a",
    );
    expect(shares).toEqual([
      { memberId: "a", shareAmount: "60.00" },
      { memberId: "b", shareAmount: "30.00" },
    ]);
  });
});

describe("simplifyDebts", () => {
  it("simplifies pairwise debts", () => {
    const debts = simplifyDebts(
      [
        { memberId: "a", displayName: "A", netAmount: "30.00" },
        { memberId: "b", displayName: "B", netAmount: "-20.00" },
        { memberId: "c", displayName: "C", netAmount: "-10.00" },
      ],
      "USD",
    );
    expect(debts.length).toBeGreaterThan(0);
    const total = debts.reduce((s, d) => s + parseFloat(d.amount), 0);
    expect(total).toBeCloseTo(30, 2);
  });
});
