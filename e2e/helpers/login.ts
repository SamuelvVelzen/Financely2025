import { expect, type Page } from "@playwright/test";
import { resolveE2eCredentials } from "../prepare-db";

export async function loginAsSeedUser(page: Page) {
  const { email, password } = resolveE2eCredentials();

  await page.goto("/login", { waitUntil: "networkidle" });
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.getByRole("textbox", { name: "Password" }).fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 });
}
