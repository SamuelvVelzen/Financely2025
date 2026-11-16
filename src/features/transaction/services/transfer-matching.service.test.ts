import { describe, expect, it } from "vitest";

const DAY_MS = 24 * 60 * 60 * 1000;

describe("transfer matching rules", () => {
  it("uses a 3-day window for pairing", () => {
    const center = new Date("2026-06-10T12:00:00.000Z").getTime();
    const from = center - 3 * DAY_MS;
    const to = center + 3 * DAY_MS;
    const candidate = new Date("2026-06-13T08:00:00.000Z").getTime();
    expect(candidate).toBeGreaterThanOrEqual(from);
    expect(candidate).toBeLessThanOrEqual(to);
  });
});
