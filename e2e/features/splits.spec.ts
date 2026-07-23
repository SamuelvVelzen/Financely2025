import { expect, test } from "@playwright/test";

test.describe("splits", () => {
  test("splits page loads and opens create dialog", async ({ page }) => {
    await page.goto("/splits");

    await expect(
      page.getByLabel("Main content").getByText("Splits", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("No split groups yet", { exact: false }),
    ).toBeVisible();

    await page
      .getByRole("button", { name: "New group" })
      .filter({ hasText: /^New group$/ })
      .click();
    await expect(
      page.getByRole("heading", { name: "New split group" }),
    ).toBeVisible();
    await expect(page.getByLabel("Group name")).toBeVisible();
  });
});
