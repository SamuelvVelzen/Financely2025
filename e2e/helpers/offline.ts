import { expect, type Page } from "@playwright/test";

/** App data API only — do not block Better Auth (`/api/auth`) or Vite. */
const API_OFFLINE_ROUTE = "**/api/v1/**";

/**
 * Simulate app offline for data/sync tests without blocking Vite module loads.
 * Full context.setOffline() breaks TanStack Start client navigations in Vite
 * ("Failed to fetch dynamically imported module").
 * Blocking all `/api/**` also breaks session refresh and redirects to login.
 */
export async function goOffline(page: Page): Promise<void> {
  await page.unroute(API_OFFLINE_ROUTE).catch(() => undefined);
  await page.route(API_OFFLINE_ROUTE, (route) =>
    route.abort("internetdisconnected"),
  );
  await page.evaluate(() => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      get: () => false,
    });
    (
      window as Window & {
        __financelySetOnlineForTests?: (next: boolean) => void;
      }
    ).__financelySetOnlineForTests?.(false);
    window.dispatchEvent(new Event("offline"));
  });
  await page.waitForFunction(() => navigator.onLine === false);
}

/** Restore API access and online status. */
export async function goOnline(page: Page): Promise<void> {
  await page.unroute(API_OFFLINE_ROUTE).catch(() => undefined);
  await page.evaluate(() => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      get: () => true,
    });
    (
      window as Window & {
        __financelySetOnlineForTests?: (next: boolean) => void;
      }
    ).__financelySetOnlineForTests?.(true);
    window.dispatchEvent(new Event("online"));
  });
  await page.waitForFunction(() => navigator.onLine === true);
}

/**
 * Assert the sidebar pending-sync badge shows the given count.
 * Desktop Chrome uses the expanded sidebar indicator.
 */
export async function expectPendingSyncCount(
  page: Page,
  count: number,
): Promise<void> {
  const badge = page.getByRole("button", {
    name: /change(?:s)? pending sync/,
  });
  await expect(badge.first()).toBeVisible({ timeout: 15_000 });
  await expect
    .poll(
      async () => {
        const text = (await badge.first().innerText()).replace(/\s+/g, " ");
        const match = text.match(/(\d+)\s+change/);
        return match ? Number(match[1]) : 0;
      },
      { timeout: 15_000 },
    )
    .toBeGreaterThanOrEqual(count);
}

/** Wait until pending sync badge is gone. */
export async function waitForChangesSynced(page: Page): Promise<void> {
  const badge = page.getByRole("button", {
    name: /change(?:s)? pending sync/,
  });
  const review = page.getByRole("button", { name: "Review pending changes" });

  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      await expect(badge).toHaveCount(0, { timeout: 15_000 });
      return;
    } catch {
      // Auto-sync may pause after failures — badge click retries; review
      // unblocks syncBlocked rows.
      if (await review.isVisible().catch(() => false)) {
        await review.click({ timeout: 5_000 }).catch(() => undefined);
        await page.keyboard.press("Escape").catch(() => undefined);
      }
      const visible = badge.first();
      if (await visible.isVisible().catch(() => false)) {
        await visible.click({ timeout: 5_000 }).catch(() => undefined);
        await page.keyboard.press("Escape").catch(() => undefined);
      }
      await page.waitForTimeout(500);
    }
  }
  await expect(badge).toHaveCount(0, { timeout: 20_000 });
}

async function waitForMainReady(page: Page): Promise<void> {
  await expect(page.getByLabel("Main content")).toBeVisible({
    timeout: 30_000,
  });
  await expect(
    page.getByLabel("Main content").getByText(/^Loading/),
  ).toHaveCount(0, { timeout: 30_000 });
  await expect(page.getByText("Something went wrong")).toHaveCount(0, {
    timeout: 5_000,
  });
}

/** Wipe offline outbox so prior failed tests cannot inflate pending counts. */
export async function clearOfflineOutbox(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open("financely-offline-mutations");
      req.onsuccess = () => resolve(req.result);
      req.onerror = () =>
        reject(req.error ?? new Error("open offline mutations failed"));
    });
    try {
      const storeNames = ["mutations", "blobs", "id-remaps"].filter((name) =>
        db.objectStoreNames.contains(name),
      );
      if (storeNames.length === 0) return;
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeNames, "readwrite");
        for (const name of storeNames) {
          tx.objectStore(name).clear();
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () =>
          reject(tx.error ?? new Error("clear offline mutations failed"));
      });
    } finally {
      db.close();
    }
  });
}

/** Navigate and wait for main content so React Query can persist to IndexedDB. */
export async function warmPage(page: Page, path: string): Promise<void> {
  await goOnline(page);
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await clearOfflineOutbox(page);
  // Reload so in-memory pending-row cache and open IDB handles reset after wipe
  await page.reload({ waitUntil: "domcontentloaded" });
  await waitForMainReady(page);
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await page.waitForTimeout(1000);
}

/**
 * Prefetch route modules while online so later offline client navigations
 * do not hit missing chunks (defense in depth with API-only offline).
 */
export async function warmRoutes(page: Page, paths: string[]): Promise<void> {
  for (const path of paths) {
    await warmPage(page, path);
  }
}

/**
 * Client-side navigation via sidebar.
 */
export async function navigateViaSidebar(
  page: Page,
  linkName: string | RegExp,
): Promise<void> {
  await page.getByRole("link", { name: linkName }).first().click();
  await waitForMainReady(page);
}
