import { expect, test } from "@playwright/test";
import { readWorkspaceId } from "../../helpers/env";

test.describe("notifications", () => {
  test("notifications page loads", async ({ page }) => {
    const workspaceId = readWorkspaceId();
    await page.goto(`/${workspaceId}/notifications`);

    await expect(
      page.getByRole("heading", { name: "Notifications" }),
    ).toBeVisible();
  });
});
