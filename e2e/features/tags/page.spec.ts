import { expect, test } from "@playwright/test";
import { readWorkspaceId } from "../../helpers/env";

test.describe("tags", () => {
  test("tags page loads with seeded tags", async ({ page }) => {
    const workspaceId = readWorkspaceId();
    await page.goto(`/${workspaceId}/tags`);

    await expect(
      page.getByLabel("Main content").getByText("Tags", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Add( tag)?/ }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Food & Dining/ }).first(),
    ).toBeVisible();
  });
});
