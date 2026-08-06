import { expect, test, type Page } from "@playwright/test";
import { readWorkspaceId } from "../../helpers/env";
import {
  changeTransactionPrimaryTag,
  deleteTransactionByName,
  editTransactionName,
  submitCreateExpense,
  submitCreateTag,
} from "../../helpers/forms";
import {
  expectPendingSyncCount,
  goOffline,
  goOnline,
  navigateViaSidebar,
  waitForChangesSynced,
  warmPage,
  warmRoutes,
} from "../../helpers/offline";

function expectAddTransactionControl(page: Page) {
  return expect(
    page
      .getByRole("button", { name: "Add transaction" })
      .or(page.getByRole("button", { name: "Add", exact: true }))
      .first(),
  ).toBeVisible();
}

test.describe("transactions offline", () => {
  test.describe.configure({ timeout: 90_000 });

  test("T1 cached transactions remain visible offline", async ({ page }) => {
    const workspaceId = readWorkspaceId();
    await warmPage(page, `/${workspaceId}/transactions`);
    await expectAddTransactionControl(page);
    await goOffline(page);
    await expectAddTransactionControl(page);
  });

  test("T2 offline create expense syncs after reconnect", async ({ page }) => {
    const workspaceId = readWorkspaceId();
    const name = `Offline Tx ${Date.now()}`;
    await warmPage(page, `/${workspaceId}/transactions`);
    await expectAddTransactionControl(page);

    await goOffline(page);
    await submitCreateExpense(page, {
      name,
      amount: "12.50",
      primaryTagName: "Food & Dining",
    });
    await expectPendingSyncCount(page, 1);
    await expect(
      page.getByLabel("Main content").getByText(name, { exact: true }),
    ).toBeVisible();

    await goOnline(page);
    await waitForChangesSynced(page);
    await page.reload();
    await expect(
      page.getByLabel("Main content").getByText(name, { exact: true }),
    ).toBeVisible();
  });

  test("T5 offline tag then transaction remaps on sync", async ({ page }) => {
    const workspaceId = readWorkspaceId();
    const tagName = `Tx Tag ${Date.now()}`;
    const txName = `Tx With Tag ${Date.now()}`;

    // Warm both destinations so offline sidebar nav can load cached modules
    await warmRoutes(page, [
      `/${workspaceId}/transactions`,
      `/${workspaceId}/tags`,
    ]);
    await goOffline(page);
    await submitCreateTag(page, tagName);
    await expectPendingSyncCount(page, 1);

    await navigateViaSidebar(page, "Transactions");
    // Full navigation recovers if sidebar kept a stale error shell; re-assert offline
    await page.goto(`/${workspaceId}/transactions`, {
      waitUntil: "domcontentloaded",
    });
    await goOffline(page);
    await expect(page.getByLabel("Main content")).toBeVisible({
      timeout: 15_000,
    });
    await submitCreateExpense(page, {
      name: txName,
      amount: "9.99",
      primaryTagName: tagName,
    });
    await expectPendingSyncCount(page, 2);

    await goOnline(page);
    await waitForChangesSynced(page);
    await page.reload();
    await expect(page.getByText(txName, { exact: true }).first()).toBeVisible();
    await page.goto(`/${workspaceId}/tags`);
    await expect(page.getByText(tagName, { exact: false }).first()).toBeVisible();
  });

  test("T6 online tag then offline transaction syncs", async ({ page }) => {
    const workspaceId = readWorkspaceId();
    const name = `Online Tag Tx ${Date.now()}`;
    await warmPage(page, `/${workspaceId}/transactions`);

    await goOffline(page);
    await submitCreateExpense(page, {
      name,
      amount: "4.00",
      primaryTagName: "Shopping",
    });
    await expectPendingSyncCount(page, 1);

    await goOnline(page);
    await waitForChangesSynced(page);
    await page.reload();
    await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
  });

  test("T7 offline create then update remaps path ids", async ({ page }) => {
    const workspaceId = readWorkspaceId();
    const initial = `Path Remap Tx ${Date.now()}`;
    const renamed = `${initial} Updated`;
    await warmPage(page, `/${workspaceId}/transactions`);

    await goOffline(page);
    await submitCreateExpense(page, {
      name: initial,
      amount: "3.25",
      primaryTagName: "Entertainment",
    });
    await expectPendingSyncCount(page, 1);
    await editTransactionName(page, initial, renamed);
    // Create + update both queue (or update may coalesce — at least one pending)
    await expect(
      page.getByRole("button", { name: /change(?:s)? pending sync/ }),
    ).toBeVisible({ timeout: 15_000 });

    await goOnline(page);
    // Give the online event + outbox drain a beat before polling the badge
    await page.waitForTimeout(1000);
    await waitForChangesSynced(page);
    await page.reload();
    await expect(page.getByText(renamed, { exact: true }).first()).toBeVisible();
  });

  test("T3 offline update existing transaction syncs", async ({ page }) => {
    const workspaceId = readWorkspaceId();
    const name = `Seeded Update Tx ${Date.now()}`;
    const renamed = `${name} Renamed`;
    await warmPage(page, `/${workspaceId}/transactions`);
    await submitCreateExpense(page, {
      name,
      amount: "7.00",
      primaryTagName: "Healthcare",
    });
    await expect(page.getByText(name, { exact: true }).first()).toBeVisible();

    await goOffline(page);
    await editTransactionName(page, name, renamed);
    await expectPendingSyncCount(page, 1);

    await goOnline(page);
    await waitForChangesSynced(page);
    await page.reload();
    await expect(page.getByText(renamed, { exact: true }).first()).toBeVisible();
  });

  test("T4 offline delete existing transaction syncs", async ({ page }) => {
    const workspaceId = readWorkspaceId();
    const name = `Delete Tx ${Date.now()}`;
    await warmPage(page, `/${workspaceId}/transactions`);
    await submitCreateExpense(page, {
      name,
      amount: "2.00",
      primaryTagName: "Transportation",
    });

    await goOffline(page);
    await deleteTransactionByName(page, name);
    await expectPendingSyncCount(page, 1);

    await goOnline(page);
    await waitForChangesSynced(page);
    await page.reload();
    await expect(page.getByText(name, { exact: true })).toHaveCount(0);
  });

  test("T8 offline create then change primary tag via edit syncs", async ({
    page,
  }) => {
    const workspaceId = readWorkspaceId();
    const name = `Tag Path Tx ${Date.now()}`;
    await warmPage(page, `/${workspaceId}/transactions`);

    await goOffline(page);
    await submitCreateExpense(page, {
      name,
      amount: "5.50",
      primaryTagName: "Food & Dining",
    });
    await changeTransactionPrimaryTag(page, name, "Shopping");
    await expectPendingSyncCount(page, 2);

    await goOnline(page);
    await waitForChangesSynced(page);
    await page.reload();
    await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
  });
});
