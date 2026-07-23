import { test as setup } from "@playwright/test";
import { STORAGE_STATE_PATH } from "./helpers/env";
import { loginAsSeedUser } from "./helpers/login";

setup("authenticate seed user", async ({ page }) => {
  await loginAsSeedUser(page);
  await page.context().storageState({ path: STORAGE_STATE_PATH });
});
