import { expect, test } from "@playwright/test";

// Register must run logged-out even when the features project uses storageState.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("auth", () => {
  test("register page shows create-account form", async ({ page }) => {
    await page.goto("/register");

    await expect(
      page.getByRole("heading", { name: "Create Account" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /Sign Up/i })).toBeVisible();
  });
});
