import { expect, type Locator, type Page } from "@playwright/test";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function dialogWithHeading(page: Page, heading: string): Locator {
  return page
    .getByRole("dialog")
    .filter({ has: page.getByRole("heading", { name: heading }) })
    .last();
}

async function selectTagOption(
  scope: Locator,
  page: Page,
  tagName: string,
): Promise<void> {
  const openPrimaryTag = async () => {
    const primaryTrigger = scope
      .getByRole("button", {
        name: /Select primary tag|Food & Dining|Shopping|Healthcare|Transport|Entertainment|Dining/i,
      })
      .first();
    if (await primaryTrigger.isVisible().catch(() => false)) {
      await primaryTrigger.click();
      return;
    }
    await scope
      .locator("div")
      .filter({ has: scope.getByText("Primary Tag", { exact: true }) })
      .locator("[data-dropdown-trigger]")
      .first()
      .click();
  };

  let search = scope.getByPlaceholder("Type to search tags...");
  // Create flow mounts the search input even while closed; edit does not.
  if (!(await search.isVisible().catch(() => false))) {
    await openPrimaryTag();
    search = scope.getByPlaceholder("Type to search tags...");
  }
  await expect(search).toBeVisible({ timeout: 10_000 });
  // Focus without an extra click that can light-dismiss the native popover
  await search.focus();
  await search.fill("");
  await page.keyboard.type(tagName, { delay: 40 });

  await expect
    .poll(
      async () => {
        return page.evaluate((name) => {
          const panels = document.querySelectorAll<HTMLElement>(
            "[data-dropdown-content]",
          );
          for (const panel of panels) {
            if (!panel.matches(":popover-open")) continue;
            const items =
              panel.querySelectorAll<HTMLElement>("[data-dropdown-item]");
            for (const item of items) {
              if (
                (item.textContent ?? "")
                  .toLowerCase()
                  .includes(name.toLowerCase())
              ) {
                item.click();
                return true;
              }
            }
          }
          return false;
        }, tagName);
      },
      { timeout: 10_000 },
    )
    .toBe(true);
}

function tagRow(page: Page, tagName: string): Locator {
  return page
    .getByLabel("Main content")
    .locator("li")
    .filter({
      has: page.getByRole("button", {
        name: new RegExp(escapeRegExp(tagName)),
      }),
    })
    .first();
}

export async function openCreateTagDialog(page: Page): Promise<Locator> {
  await page.getByRole("button", { name: /Add( tag)?/ }).first().click();
  const dialog = dialogWithHeading(page, "Create Tag");
  await expect(dialog.getByRole("heading", { name: "Create Tag" })).toBeVisible();
  return dialog;
}

export async function submitCreateTag(
  page: Page,
  name: string,
): Promise<void> {
  const dialog = await openCreateTagDialog(page);
  await dialog.getByPlaceholder("e.g. Food & Dining").fill(name);
  const color = dialog.getByLabel("Color", { exact: true });
  if (await color.isVisible().catch(() => false)) {
    await color.fill("#C45A2C");
  }
  await dialog.getByRole("button", { name: "Create", exact: true }).click();
  await expect(dialog).toBeHidden({ timeout: 15_000 });
}

export async function openTagActionsMenu(
  page: Page,
  tagName: string,
): Promise<void> {
  const row = tagRow(page, tagName);
  await expect(row).toBeVisible({ timeout: 10_000 });
  await row
    .getByRole("toolbar")
    .locator("[data-dropdown-trigger] button")
    .click();
  await expect(
    page.getByRole("button", { name: "Delete", exact: true }),
  ).toBeVisible({ timeout: 10_000 });
}

export async function editTagName(
  page: Page,
  currentName: string,
  nextName: string,
): Promise<void> {
  await page
    .getByLabel("Main content")
    .getByRole("button", { name: new RegExp(escapeRegExp(currentName)) })
    .first()
    .click();
  const dialog = dialogWithHeading(page, "Edit Tag");
  await expect(dialog.getByRole("heading", { name: "Edit Tag" })).toBeVisible();
  await dialog.getByPlaceholder("e.g. Food & Dining").fill(nextName);
  const color = dialog.getByLabel("Color", { exact: true });
  if (await color.isVisible().catch(() => false)) {
    const value = await color.inputValue();
    if (!value || value === "#000000") {
      await color.fill("#C45A2C");
    }
  }
  await dialog.getByRole("button", { name: "Update", exact: true }).click();
  await expect(dialog).toBeHidden({ timeout: 15_000 });
}

export async function deleteTag(page: Page, tagName: string): Promise<void> {
  await openTagActionsMenu(page, tagName);
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  const dialog = dialogWithHeading(page, "Delete Tag");
  await expect(dialog.getByRole("heading", { name: "Delete Tag" })).toBeVisible();
  await dialog.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(dialog).toBeHidden({ timeout: 15_000 });
}

export async function openCreateTransactionDialog(page: Page): Promise<Locator> {
  const main = page.getByLabel("Main content");
  const addTransaction = main.getByRole("button", { name: "Add transaction" });
  const add = main.getByRole("button", { name: "Add", exact: true });
  if (await addTransaction.isVisible().catch(() => false)) {
    await addTransaction.click();
  } else {
    await expect(add).toBeVisible({ timeout: 15_000 });
    await add.click();
  }
  const dialog = dialogWithHeading(page, "Create Transaction");
  await expect(
    dialog.getByRole("heading", { name: "Create Transaction" }),
  ).toBeVisible({ timeout: 15_000 });
  return dialog;
}

export async function submitCreateExpense(
  page: Page,
  options: {
    name: string;
    amount: string;
    primaryTagName?: string;
  },
): Promise<void> {
  const dialog = await openCreateTransactionDialog(page);
  await dialog.getByRole("textbox", { name: /^Name/ }).fill(options.name);
  await dialog.getByRole("textbox", { name: /^Amount/ }).fill(options.amount);
  if (options.primaryTagName) {
    await selectTagOption(dialog, page, options.primaryTagName);
  }
  await dialog.getByRole("button", { name: "Create", exact: true }).click();
  await expect(dialog).toBeHidden({ timeout: 15_000 });
}

export async function openTransactionByName(
  page: Page,
  name: string,
): Promise<Locator> {
  const item = page
    .getByLabel("Main content")
    .getByText(name, { exact: true })
    .first();
  await expect(item).toBeVisible({ timeout: 15_000 });
  return item;
}

export async function editTransactionName(
  page: Page,
  currentName: string,
  nextName: string,
): Promise<void> {
  await (await openTransactionByName(page, currentName)).click();
  const dialog = dialogWithHeading(page, "Edit Transaction");
  await expect(
    dialog.getByRole("heading", { name: "Edit Transaction" }),
  ).toBeVisible({ timeout: 15_000 });
  await dialog.getByRole("textbox", { name: /^Name/ }).fill(nextName);
  await dialog.getByRole("button", { name: "Update", exact: true }).click();
  await expect(dialog).toBeHidden({ timeout: 15_000 });
}

export async function deleteTransactionByName(
  page: Page,
  name: string,
): Promise<void> {
  const row = page
    .getByLabel("Main content")
    .locator("li")
    .filter({ hasText: name })
    .first();
  await expect(row).toBeVisible({ timeout: 10_000 });
  // Transaction row actions use role="presentation", not toolbar
  await row.locator("[data-dropdown-trigger] button").click();
  await expect(
    page.getByRole("button", { name: "Delete", exact: true }),
  ).toBeVisible({ timeout: 5_000 });
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  const dialog = page.getByRole("dialog").last();
  await dialog.getByRole("button", { name: "Delete", exact: true }).click();
}

export async function changeTransactionPrimaryTag(
  page: Page,
  transactionName: string,
  nextTagName: string,
): Promise<void> {
  await (await openTransactionByName(page, transactionName)).click();
  const dialog = dialogWithHeading(page, "Edit Transaction");
  await expect(
    dialog.getByRole("heading", { name: "Edit Transaction" }),
  ).toBeVisible();
  await selectTagOption(dialog, page, nextTagName);
  await dialog.getByRole("button", { name: "Update", exact: true }).click();
  await expect(dialog).toBeHidden({ timeout: 15_000 });
}
