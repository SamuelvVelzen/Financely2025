import { expect, test, type Page } from "@playwright/test";
import { readWorkspaceId } from "../../helpers/env";
import { submitCreateTag } from "../../helpers/forms";
import {
  expectPendingSyncCount,
  goOffline,
  goOnline,
  navigateViaSidebar,
  waitForChangesSynced,
  warmPage,
  warmRoutes,
} from "../../helpers/offline";

async function warmBudgetCreateRoute(
  page: Page,
  workspaceId: string,
): Promise<void> {
  await warmRoutes(page, [
    `/${workspaceId}/budgets`,
    `/${workspaceId}/budgets/new`,
  ]);
  await page.getByLabel("Back to budgets").click();
  await expect(page.getByText("Budgets").first()).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Create Budget", exact: true }),
  ).toHaveCount(0);
}

async function openCreateBudgetFlow(page: Page): Promise<void> {
  const main = page.getByLabel("Main content");
  const add = main.getByRole("button", { name: /^Add$/ });
  const create = main.getByRole("button", { name: "Create Budget" });
  if (await add.isVisible().catch(() => false)) {
    await add.click();
  } else if (await create.isVisible().catch(() => false)) {
    await create.click();
  } else {
    await main.getByLabel("Add budget").click();
  }
  await expect(
    page.getByRole("heading", { name: "Create Budget", exact: true }),
  ).toBeVisible({ timeout: 15_000 });
}

async function createBudgetWithTag(
  page: Page,
  options: { name: string; tagName: string; pendingCount?: number },
): Promise<void> {
  await openCreateBudgetFlow(page);

  // Custom preset is a role=radio button (not input) — use click, not check
  const customPreset = page.getByRole("radio", { name: /Custom/i });
  if (await customPreset.isVisible().catch(() => false)) {
    await customPreset.click();
  }

  const nameField = page.getByLabel("Budget Name");
  await nameField.click();
  await nameField.fill(options.name);
  await page.getByRole("button", { name: "Next" }).click();

  const tagCheckbox = page.getByRole("checkbox", {
    name: new RegExp(options.tagName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
  });
  if (await tagCheckbox.isVisible().catch(() => false)) {
    await tagCheckbox.check();
  } else {
    await page.getByText(options.tagName, { exact: true }).first().click();
  }

  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByText("Set Expected Amounts")).toBeVisible({
    timeout: 10_000,
  });

  const itemRows = page.getByLabel("Main content").locator('[role="tabpanel"] li');
  const rowCount = await itemRows.count();
  for (let i = 0; i < rowCount; i++) {
    const amount = itemRows.nth(i).locator('input[inputmode="decimal"]').first();
    if (!(await amount.isVisible().catch(() => false))) continue;
    await amount.click();
    await amount.fill("");
    await amount.pressSequentially("100");
  }

  // Preset effects can overwrite the name — set it immediately before submit
  await page.getByRole("tab", { name: "General" }).click();
  await nameField.click();
  await nameField.fill("");
  await nameField.pressSequentially(options.name, { delay: 15 });
  await page.getByRole("tab", { name: "Budget" }).click();
  await page.getByRole("button", { name: "Create Budget" }).click();
  await expect(page.getByText("Amount is required")).toHaveCount(0, {
    timeout: 5_000,
  });
  await expectPendingSyncCount(page, options.pendingCount ?? 1);
}

test.describe("budgets offline", () => {
  test.describe.configure({ timeout: 90_000 });

  test("B1 offline create budget with existing tag syncs", async ({ page }) => {
    const workspaceId = readWorkspaceId();
    const name = `Offline Budget ${Date.now()}`;
    await warmBudgetCreateRoute(page, workspaceId);

    await goOffline(page);
    await createBudgetWithTag(page, {
      name,
      tagName: "Food & Dining",
    });
    await expectPendingSyncCount(page, 1);

    await goOnline(page);
    await waitForChangesSynced(page);
    await page.goto(`/${workspaceId}/budgets`);
    await expect(page.getByText(name, { exact: false }).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("B2 offline create tag then budget referencing it syncs", async ({
    page,
  }) => {
    const workspaceId = readWorkspaceId();
    const tagName = `Budget Tag ${Date.now()}`;
    const budgetName = `Budget ${Date.now()}`;

    await warmBudgetCreateRoute(page, workspaceId);
    await warmPage(page, `/${workspaceId}/tags`);
    await goOffline(page);
    await submitCreateTag(page, tagName);
    await expectPendingSyncCount(page, 1);

    await navigateViaSidebar(page, "Budgets");
    await createBudgetWithTag(page, {
      name: budgetName,
      tagName,
      pendingCount: 2,
    });

    await goOnline(page);
    await waitForChangesSynced(page);
    await page.goto(`/${workspaceId}/budgets`);
    await expect(
      page.getByText(budgetName, { exact: false }).first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("B3 offline create budget then update name syncs", async ({ page }) => {
    const workspaceId = readWorkspaceId();
    const name = `Budget Remap ${Date.now()}`;
    const renamed = `${name} Updated`;
    await warmBudgetCreateRoute(page, workspaceId);

    await goOffline(page);
    await createBudgetWithTag(page, {
      name,
      tagName: "Shopping",
    });

    await navigateViaSidebar(page, "Budgets");
    const row = page
      .getByLabel("Main content")
      .locator("li")
      .filter({ hasText: name })
      .first();
    await expect(row).toBeVisible({ timeout: 15_000 });
    await row.locator("[data-dropdown-trigger] button").click();
    await page.getByRole("button", { name: "Edit", exact: true }).click();

    const nameField = page.getByLabel("Budget Name");
    await expect(nameField).toBeVisible({ timeout: 15_000 });
    await nameField.fill(renamed);
    await page.getByRole("tab", { name: "Budget" }).click();
    await page.getByRole("button", { name: "Update Budget" }).click();
    await expectPendingSyncCount(page, 2);

    await goOnline(page);
    await waitForChangesSynced(page);
    await page.goto(`/${workspaceId}/budgets`);
    await expect(
      page
        .getByText(
          new RegExp(
            `${renamed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}|${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
          ),
        )
        .first(),
    ).toBeVisible({ timeout: 15_000 });
  });
});
