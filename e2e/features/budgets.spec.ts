import { expect, test } from "@playwright/test";
import { readWorkspaceId } from "../helpers/env";

test.describe("budgets", () => {
  test("budgets page loads and can start create", async ({ page }) => {
    const workspaceId = readWorkspaceId();
    await page.goto(`/${workspaceId}/budgets`);

    await expect(
      page.getByLabel("Main content").getByText("Budgets", { exact: true }),
    ).toBeVisible();

    await page.getByRole("button", { name: /Add( budget)?/ }).first().click();
    await expect(page).toHaveURL(new RegExp(`/${workspaceId}/budgets/new`));
  });
});
