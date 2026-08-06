import { expect, test } from "@playwright/test";
import { readWorkspaceId } from "../../helpers/env";

test.describe("dashboard", () => {
  test("workspace dashboard loads", async ({ page }) => {
    const workspaceId = readWorkspaceId();
    await page.goto(`/${workspaceId}`);

    await expect(
      page.getByRole("heading", { name: "Dashboard" }),
    ).toBeVisible();
  });
});
