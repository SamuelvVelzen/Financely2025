import { describe, expect, it } from "vitest";
import { findCsvTransferPairSuggestions } from "./find-csv-transfer-pair-suggestions";

describe("findCsvTransferPairSuggestions", () => {
  it("pairs expense and income with same amount within 3 days", () => {
    const candidates = [
      {
        rowIndex: 0,
        status: "valid" as const,
        data: {
          type: "EXPENSE" as const,
          amount: "100.00",
          currency: "EUR",
          transactionDate: "2025-06-01T00:00:00.000Z",
          name: "ING outbound",
          paymentMethod: "BANK_TRANSFER" as const,
          tagIds: [],
        },
        primaryTagMetadata: null,
        tagsMetadata: [],
        errors: [],
      },
      {
        rowIndex: 1,
        status: "valid" as const,
        data: {
          type: "INCOME" as const,
          amount: "100.00",
          currency: "EUR",
          transactionDate: "2025-06-02T00:00:00.000Z",
          name: "N26 inbound",
          paymentMethod: "BANK_TRANSFER" as const,
          tagIds: [],
        },
        primaryTagMetadata: null,
        tagsMetadata: [],
        errors: [],
      },
    ];

    const pairs = findCsvTransferPairSuggestions(candidates);
    expect(pairs).toHaveLength(1);
    expect(pairs[0]?.outRowIndex).toBe(0);
    expect(pairs[0]?.inRowIndex).toBe(1);
  });
});
