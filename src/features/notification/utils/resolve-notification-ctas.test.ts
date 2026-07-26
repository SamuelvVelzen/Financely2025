import { describe, expect, it } from "vitest";
import { NOTIFICATION_RELATED_TYPE } from "./notification-related-type";
import { resolveNotificationCtas } from "./resolve-notification-ctas";

describe("resolveNotificationCtas", () => {
  it("derives CTA from relatedType", () => {
    expect(
      resolveNotificationCtas(
        { relatedType: NOTIFICATION_RELATED_TYPE.subscription, actions: null },
        7,
      ),
    ).toEqual([
      { label: "Review subscriptions", path: "/7/subscriptions" },
    ]);
  });

  it("prefers relatedType over stored actions", () => {
    expect(
      resolveNotificationCtas(
        {
          relatedType: NOTIFICATION_RELATED_TYPE.import,
          actions: [
            {
              label: "Legacy",
              type: "navigate",
              path: "/1/old",
            },
          ],
        },
        3,
      ),
    ).toEqual([{ label: "View transactions", path: "/3/transactions" }]);
  });

  it("falls back to stored navigate actions when relatedType is missing", () => {
    expect(
      resolveNotificationCtas(
        {
          relatedType: null,
          actions: [
            {
              label: "Dismiss",
              type: "dismiss",
            },
            {
              label: "Open",
              type: "navigate",
              path: "/2/transactions",
            },
          ],
        },
        2,
      ),
    ).toEqual([{ label: "Open", path: "/2/transactions" }]);
  });

  it("returns no CTAs when there is no relatedType or navigate action", () => {
    expect(
      resolveNotificationCtas({ relatedType: null, actions: null }, 1),
    ).toEqual([]);
  });
});
