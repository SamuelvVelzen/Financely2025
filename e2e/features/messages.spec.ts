import { expect, test } from "@playwright/test";
import { readWorkspaceId } from "../helpers/env";

test.describe("messages", () => {
  test("messages page loads", async ({ page }) => {
    const workspaceId = readWorkspaceId();
    await page.goto(`/${workspaceId}/messages`);

    await expect(
      page.getByRole("heading", { name: "Messages" }),
    ).toBeVisible();
  });
});
