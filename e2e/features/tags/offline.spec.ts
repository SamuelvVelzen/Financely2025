import { expect, test } from "@playwright/test";
import { readWorkspaceId } from "../../helpers/env";
import {
  deleteTag,
  editTagName,
  submitCreateTag,
} from "../../helpers/forms";
import {
  expectPendingSyncCount,
  goOffline,
  goOnline,
  waitForChangesSynced,
  warmPage,
} from "../../helpers/offline";

test.describe("tags offline", () => {
  test.describe.configure({ timeout: 90_000 });

  test("G1 offline create tag syncs after reconnect", async ({ page }) => {
    const workspaceId = readWorkspaceId();
    const tagName = `Offline Tag ${Date.now()}`;
    await warmPage(page, `/${workspaceId}/tags`);
    await expect(
      page.getByRole("button", { name: /Food & Dining/ }).first(),
    ).toBeVisible();

    await goOffline(page);
    await submitCreateTag(page, tagName);
    await expectPendingSyncCount(page, 1);
    await expect(
      page.getByLabel("Main content").getByText(tagName, { exact: true }),
    ).toBeVisible();

    await goOnline(page);
    await waitForChangesSynced(page);
    await page.reload();
    await expect(
      page.getByLabel("Main content").getByText(tagName, { exact: true }),
    ).toBeVisible();
  });

  test("G2 offline create then update name syncs final name", async ({
    page,
  }) => {
    const workspaceId = readWorkspaceId();
    const initial = `Offline Edit ${Date.now()}`;
    const renamed = `${initial} Renamed`;
    await warmPage(page, `/${workspaceId}/tags`);

    await goOffline(page);
    await submitCreateTag(page, initial);
    await expectPendingSyncCount(page, 1);
    await editTagName(page, initial, renamed);
    await expectPendingSyncCount(page, 2);

    await goOnline(page);
    await waitForChangesSynced(page);
    await page.reload();
    await expect(
      page.getByLabel("Main content").getByText(renamed, { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByLabel("Main content").getByText(initial, { exact: true }),
    ).toHaveCount(0);
  });

  test("G3 offline create then delete before sync leaves no orphan", async ({
    page,
  }) => {
    const workspaceId = readWorkspaceId();
    const tagName = `Offline Delete ${Date.now()}`;
    await warmPage(page, `/${workspaceId}/tags`);

    await goOffline(page);
    await submitCreateTag(page, tagName);
    await deleteTag(page, tagName);

    await goOnline(page);
    // Queue may drain to empty without a toast if create was removed with dependents
    await expect(
      page.getByRole("button", { name: /change(?:s)? pending sync/ }),
    ).toHaveCount(0, { timeout: 30_000 });
    await page.reload();
    await expect(
      page.getByLabel("Main content").getByText(tagName, { exact: true }),
    ).toHaveCount(0);
  });

  test("G4 offline update seeded tag syncs", async ({ page }) => {
    const workspaceId = readWorkspaceId();
    const suffix = ` ${Date.now()}`;
    const original = "Food & Dining";
    const renamed = `Food & Dining${suffix}`;
    await warmPage(page, `/${workspaceId}/tags`);
    await expect(
      page.getByRole("button", { name: /Food & Dining/ }).first(),
    ).toBeVisible();

    await goOffline(page);
    await editTagName(page, original, renamed);
    await expectPendingSyncCount(page, 1);

    await goOnline(page);
    await waitForChangesSynced(page);
    await page.reload();
    await expect(
      page.getByLabel("Main content").getByText(renamed, { exact: true }),
    ).toBeVisible();

    // Restore for other tests
    await editTagName(page, renamed, original);
  });
});
