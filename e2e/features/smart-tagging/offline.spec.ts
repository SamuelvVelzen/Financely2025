import { expect, test } from "@playwright/test";
import { readWorkspaceId } from "../../helpers/env";
import {
  expectPendingSyncCount,
  goOffline,
  goOnline,
  waitForChangesSynced,
  warmPage,
} from "../../helpers/offline";

test.describe("smart-tagging offline", () => {
  test.describe.configure({ timeout: 90_000 });

  test("R1 offline create tag rule for existing tag syncs", async ({ page }) => {
    const workspaceId = readWorkspaceId();
    const keyword = `offline-rule-${Date.now()}`;
    await warmPage(page, `/${workspaceId}/tags`);

    await page
      .getByLabel("Main content")
      .getByRole("button", { name: /Food & Dining/ })
      .first()
      .click();

    const editDialog = page
      .getByRole("dialog")
      .filter({ has: page.getByRole("heading", { name: "Edit Tag" }) });
    await expect(editDialog).toBeVisible({ timeout: 15_000 });

    await editDialog.getByRole("button", { name: /Tagging rules/i }).click();
    await expect(editDialog.getByText("Tagging rules").first()).toBeVisible();

    // Section header uses a short "Add" button (plus icon + Add)
    const addRule = editDialog.getByRole("button", { name: /^Add$/ });
    await expect(addRule).toBeVisible({ timeout: 10_000 });

    await goOffline(page);
    await addRule.click();

    const ruleDialog = page
      .getByRole("dialog")
      .filter({
        has: page.getByRole("heading", { name: /Add tag rule|Edit tag rule/i }),
      })
      .last();
    await expect(ruleDialog).toBeVisible({ timeout: 10_000 });

    const keywords = ruleDialog.getByLabel("Keywords");
    await expect(keywords).toBeVisible();
    await keywords.fill(keyword);

    await ruleDialog.getByRole("button", { name: "Create", exact: true }).click();
    await expectPendingSyncCount(page, 1);

    await goOnline(page);
    await waitForChangesSynced(page);
  });
});
