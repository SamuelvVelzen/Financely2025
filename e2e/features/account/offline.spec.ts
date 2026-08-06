import { expect, test } from "@playwright/test";
import { readWorkspaceId } from "../../helpers/env";
import { submitCreateExpense } from "../../helpers/forms";
import {
  expectPendingSyncCount,
  goOffline,
  goOnline,
  waitForChangesSynced,
  warmPage,
} from "../../helpers/offline";

test.describe("account offline", () => {
  test.describe.configure({ timeout: 90_000 });

  test("A1 offline user preferences (API) sync", async ({ page }) => {
    await warmPage(page, "/account");
    await expect(
      page.getByRole("heading", { name: "Account", exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Workspace preferences")).toBeVisible({
      timeout: 15_000,
    });

    await goOffline(page);
    await page.getByLabel("Edit workspace preferences").click();

    const smartTagging = page.getByLabel("Enable smart tagging");
    await expect(smartTagging).toBeVisible({ timeout: 10_000 });
    await smartTagging.click();

    const save = page.getByRole("button", { name: "Save Changes" });
    await expect(save).toBeEnabled({ timeout: 5_000 });
    await save.click();
    await expectPendingSyncCount(page, 1);

    await goOnline(page);
    await waitForChangesSynced(page);
  });

  test("A2 profile Better Auth update does not enter outbox", async ({
    page,
  }) => {
    await warmPage(page, "/account");
    await goOffline(page);

    const firstName = page.getByLabel(/First name/i);
    if (!(await firstName.isVisible().catch(() => false))) {
      const edit = page.getByLabel(/Edit profile/i).first();
      if (await edit.isVisible().catch(() => false)) {
        await edit.click();
      }
    }

    if (await firstName.isVisible().catch(() => false)) {
      await firstName.fill(`Offline${Date.now()}`);
      await page.getByRole("button", { name: /Save Changes/i }).click();
    }

    await expect(
      page.getByRole("button", { name: /change(?:s)? pending sync/ }),
    ).toHaveCount(0);
  });

  test("A3 sign-out with pending mutations shows gate", async ({ page }) => {
    const workspaceId = readWorkspaceId();
    await warmPage(page, `/${workspaceId}/transactions`);
    await goOffline(page);
    await submitCreateExpense(page, {
      name: `SignOut Gate ${Date.now()}`,
      amount: "1.00",
      primaryTagName: "Other",
    });
    await expectPendingSyncCount(page, 1);

    await page.getByRole("button", { name: "Logout" }).click();
    await expect(
      page.getByRole("heading", { name: "Unsynced changes on this device" }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole("button", { name: "Sign out anyway" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Stay signed in" }).click();
    await expectPendingSyncCount(page, 1);
  });
});
