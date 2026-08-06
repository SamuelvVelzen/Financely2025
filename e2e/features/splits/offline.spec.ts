import { expect, test, type Page } from "@playwright/test";
import { readWorkspaceId } from "../../helpers/env";
import {
  expectPendingSyncCount,
  goOffline,
  goOnline,
  waitForChangesSynced,
  warmPage,
} from "../../helpers/offline";

async function createSplitGroupOnline(page: Page, name: string): Promise<void> {
  await page
    .getByRole("button", { name: /New (group|split group)/ })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "New split group" }),
  ).toBeVisible();
  await page.getByLabel("Group name").fill(name);
  await page.getByRole("button", { name: "Create & invite" }).click();
  const inviteDialog = page
    .getByRole("dialog")
    .filter({ has: page.getByRole("heading", { name: "Invite people" }) });
  await expect(inviteDialog).toBeVisible({ timeout: 15_000 });
  await inviteDialog.getByRole("button", { name: "Done" }).click();
  await expect(inviteDialog).toBeHidden({ timeout: 10_000 });
  await expect(page.getByText(name, { exact: false }).first()).toBeVisible({
    timeout: 15_000,
  });
}

async function openSplitGroup(page: Page, name: string): Promise<void> {
  await page
    .getByLabel("Main content")
    .getByText(name, { exact: false })
    .first()
    .click();
  await expect(page.getByLabel("Main content")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Add expense" }).first(),
  ).toBeVisible({ timeout: 15_000 });
}

async function addSplitExpense(
  page: Page,
  options: { description: string; amount: string; addToTransactions?: boolean },
): Promise<void> {
  await page.getByRole("button", { name: "Add expense" }).first().click();
  const dialog = page
    .getByRole("dialog")
    .filter({ has: page.getByRole("heading", { name: "Add expense" }) })
    .last();
  await expect(dialog.getByRole("heading", { name: "Add expense" })).toBeVisible();
  await dialog.getByRole("textbox", { name: "Description" }).fill(options.description);
  await dialog.getByRole("textbox", { name: /^Amount/ }).fill(options.amount);
  if (options.addToTransactions) {
    await dialog.getByLabel("Add to my personal transactions").check();
  }
  await dialog.getByRole("button", { name: "Add expense", exact: true }).click();
  await expect(dialog).toBeHidden({ timeout: 15_000 });
}

test.describe("splits offline", () => {
  test.describe.configure({ timeout: 90_000 });

  test("S1 online group, offline expense without personal sync", async ({
    page,
  }) => {
    const groupName = `Offline Split ${Date.now()}`;
    const expenseName = `Coffee ${Date.now()}`;
    await warmPage(page, "/splits");
    await createSplitGroupOnline(page, groupName);
    await openSplitGroup(page, groupName);

    await goOffline(page);
    await addSplitExpense(page, { description: expenseName, amount: "10" });
    await expect(
      page.getByLabel("Main content").getByText(expenseName, { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByLabel("Main content").getByText("Syncing when online").first(),
    ).toBeVisible();
    await expectPendingSyncCount(page, 1);

    await goOnline(page);
    await waitForChangesSynced(page);
    await expect(
      page.getByLabel("Main content").getByText(expenseName, { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByLabel("Main content").getByText("Syncing when online"),
    ).toHaveCount(0);
  });

  test("S2 offline expense with add to personal transactions", async ({
    page,
  }) => {
    const workspaceId = readWorkspaceId();
    const groupName = `Split Ledger ${Date.now()}`;
    const expenseName = `Dinner ${Date.now()}`;
    await warmPage(page, "/splits");
    await createSplitGroupOnline(page, groupName);
    await openSplitGroup(page, groupName);

    await goOffline(page);
    await addSplitExpense(page, {
      description: expenseName,
      amount: "25",
      addToTransactions: true,
    });
    await expectPendingSyncCount(page, 1);

    await goOnline(page);
    await waitForChangesSynced(page);
    await page.goto(`/${workspaceId}/transactions`);
    await expect(
      page.getByText(new RegExp(`Split:.*${expenseName}|${expenseName}`)).first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("S4 offline create group then expense syncs", async ({ page }) => {
    const groupName = `Offline Group ${Date.now()}`;
    const expenseName = `Taxi ${Date.now()}`;
    await warmPage(page, "/splits");

    await goOffline(page);
    await page
      .getByRole("button", { name: /New (group|split group)/ })
      .first()
      .click();
    await page.getByLabel("Group name").fill(groupName);
    await page.getByRole("button", { name: "Create & invite" }).click();
    const inviteDialog = page
      .getByRole("dialog")
      .filter({ has: page.getByRole("heading", { name: "Invite people" }) });
    await expect(inviteDialog).toBeVisible({ timeout: 15_000 });
    await inviteDialog.getByRole("button", { name: "Done" }).click();
    await expect(inviteDialog).toBeHidden({ timeout: 10_000 });
    await expectPendingSyncCount(page, 1);

    // Prefer in-group Add expense after Done navigates; fall back to list → open
    const addExpense = page.getByRole("button", { name: "Add expense" });
    if (!(await addExpense.first().isVisible({ timeout: 5_000 }).catch(() => false))) {
      await page.getByRole("link", { name: "Splits" }).first().click();
      await expect(
        page.getByLabel("Main content").getByText(groupName, { exact: false }).first(),
      ).toBeVisible({ timeout: 15_000 });
      await openSplitGroup(page, groupName);
    }
    await expect(addExpense.first()).toBeVisible({ timeout: 15_000 });
    await addSplitExpense(page, { description: expenseName, amount: "8" });
    await expectPendingSyncCount(page, 2);

    await goOnline(page);
    await waitForChangesSynced(page);
    await page.goto("/splits");
    await expect(page.getByText(groupName, { exact: false }).first()).toBeVisible();
    await openSplitGroup(page, groupName);
    await expect(page.getByText(expenseName, { exact: true }).first()).toBeVisible();
  });

  test("S3 offline toggle add-to-transactions on existing expense", async ({
    page,
  }) => {
    const workspaceId = readWorkspaceId();
    const groupName = `Toggle Sync ${Date.now()}`;
    const expenseName = `Lunch ${Date.now()}`;
    await warmPage(page, "/splits");
    await createSplitGroupOnline(page, groupName);
    await openSplitGroup(page, groupName);
    await addSplitExpense(page, { description: expenseName, amount: "15" });

    await goOffline(page);
    const row = page
      .getByLabel("Main content")
      .locator("li")
      .filter({ hasText: expenseName })
      .first();
    await row.locator("[data-dropdown-trigger] button").click();
    const toggled = await page.evaluate(() => {
      const panels = document.querySelectorAll<HTMLElement>(
        "[data-dropdown-content]",
      );
      for (const panel of panels) {
        if (!panel.matches(":popover-open")) continue;
        const items = panel.querySelectorAll<HTMLElement>("[data-dropdown-item]");
        for (const item of items) {
          if ((item.textContent ?? "").includes("Add to my transactions")) {
            item.click();
            return true;
          }
        }
      }
      return false;
    });
    expect(toggled).toBe(true);
    await expectPendingSyncCount(page, 1);

    await goOnline(page);
    await waitForChangesSynced(page);
    await page.goto(`/${workspaceId}/transactions`);
    await expect(
      page.getByText(new RegExp(`Split:.*${expenseName}|${expenseName}`)).first(),
    ).toBeVisible({ timeout: 15_000 });
  });
});
