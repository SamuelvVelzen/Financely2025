import { expect, test } from "@playwright/test";
import { readWorkspaceId } from "../../helpers/env";
import {
  expectPendingSyncCount,
  goOffline,
  goOnline,
  waitForChangesSynced,
  warmPage,
} from "../../helpers/offline";

test.describe("subscriptions offline", () => {
  test("U3 detect subscriptions while offline does not queue", async ({
    page,
  }) => {
    const workspaceId = readWorkspaceId();
    await warmPage(page, `/${workspaceId}/subscriptions`);

    await goOffline(page);
    await page
      .getByRole("button", { name: /Detect( Subscriptions)?/ })
      .first()
      .click();

    // GET path — should not enqueue pending mutations for detect itself
    await expect(
      page.getByRole("button", { name: /change(?:s)? pending sync/ }),
    ).toHaveCount(0);

    // Dialog may show error / fail loading
    await expect(
      page.getByRole("heading", { name: "Detect Subscriptions" }),
    ).toBeVisible();
  });

  test("U1 offline dismiss candidate syncs when candidates exist", async ({
    page,
  }) => {
    const workspaceId = readWorkspaceId();
    await warmPage(page, `/${workspaceId}/subscriptions`);

    // Ensure candidates via online detect first when possible
    const detect = page
      .getByRole("button", { name: /Detect( Subscriptions)?/ })
      .first();
    await detect.click();
    await expect(
      page.getByRole("heading", { name: "Detect Subscriptions" }),
    ).toBeVisible();

    const dismiss = page.getByRole("button", { name: "Not a subscription" }).first();
    const hasCandidate = await dismiss.isVisible({ timeout: 20_000 }).catch(() => false);
    test.skip(!hasCandidate, "No subscription candidates in seed data");

    await page.keyboard.press("Escape").catch(() => undefined);
    await goOffline(page);
    await detect.click();
    await dismiss.click();
    await expectPendingSyncCount(page, 1);

    await goOnline(page);
    await waitForChangesSynced(page);
  });
});
