import { expect, test } from "@playwright/test";
import { readWorkspaceId } from "../helpers/env";

test.describe("subscriptions", () => {
  test("subscriptions page loads", async ({ page }) => {
    const workspaceId = readWorkspaceId();
    await page.goto(`/${workspaceId}/subscriptions`);

    await expect(
      page.getByLabel("Main content").locator("span").filter({
        hasText: /^Subscriptions$/,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Detect Subscriptions" }).first(),
    ).toBeVisible();
  });
});
