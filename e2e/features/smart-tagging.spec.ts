import { expect, test } from "@playwright/test";
import { readWorkspaceId } from "../helpers/env";

test.describe("smart tagging", () => {
  test("smart tagging page loads", async ({ page }) => {
    const workspaceId = readWorkspaceId();
    await page.goto(`/${workspaceId}/tags/smart-tagging`);

    await expect(
      page.getByRole("heading", { name: "Smart tagging" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Add rule/i }),
    ).toBeVisible();
  });
});
