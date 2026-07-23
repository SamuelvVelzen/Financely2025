import { expect, test } from "@playwright/test";

test.describe("smoke", () => {
  test("login page renders email sign-in", async ({ page }) => {
    await page.goto("/login");

    await expect(
      page.getByRole("heading", { name: "Sign In" }),
    ).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Email" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Password" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
  });

  test("authenticated user can open splits", async ({ page }) => {
    const email = process.env.SEED_USER_EMAIL ?? "e2e@financely.local";
    const password = process.env.SEED_USER_PASSWORD ?? "e2e-password-123";

    await page.goto("/login", { waitUntil: "networkidle" });
    await page.getByRole("textbox", { name: "Email" }).fill(email);
    await page.getByRole("textbox", { name: "Password" }).fill(password);
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 });

    await page.goto("/splits");
    await expect(
      page.getByLabel("Main content").getByText("Splits", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /New group|New split group/ }),
    ).toBeVisible();
  });
});
