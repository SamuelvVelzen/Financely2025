import { expect, test } from "@playwright/test";
import { readWorkspaceId } from "../helpers/env";

test.describe("transactions", () => {
  test("transactions page loads and opens add flow", async ({ page }) => {
    const workspaceId = readWorkspaceId();
    await page.goto(`/${workspaceId}/transactions`);

    await expect(
      page.getByLabel("Main content").getByText("Transactions", { exact: true }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Add transaction" }).click();
    await expect(
      page.getByRole("heading", { name: "Create Transaction" }),
    ).toBeVisible();
  });
});
