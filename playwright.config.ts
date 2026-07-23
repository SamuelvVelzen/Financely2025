import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";
import path from "node:path";
import { STORAGE_STATE_PATH } from "./e2e/helpers/env";

config({ path: ".env" });

const e2eDbPath = path.join(process.cwd(), "prisma/data/e2e.db");
const e2eDatabaseUrl = `file:${e2eDbPath}`;
const e2ePort = process.env.PLAYWRIGHT_PORT ?? "3100";
const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${e2ePort}`;

process.env.DATABASE_URL = e2eDatabaseUrl;
process.env.RATE_LIMIT_DISABLED ??= "true";
process.env.BETTER_AUTH_SECRET ??=
  "e2e-test-secret-key-at-least-32-chars-long";
process.env.BETTER_AUTH_URL ??= baseURL;
process.env.VITE_ENABLE_EMAIL_PASSWORD ??= "true";
process.env.VITE_ENABLE_MAGIC_LINK ??= "false";
process.env.SEED_USER_EMAIL ??= "e2e@financely.local";
process.env.SEED_USER_PASSWORD ??= "e2e-password-123";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? "github" : "list",
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "smoke",
      testMatch: /smoke\/.*\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "features",
      testMatch: /features\/.*\.spec\.ts/,
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: STORAGE_STATE_PATH,
      },
    },
  ],
  webServer: {
    // Dedicated port so local `yarn dev` on :3000 is not reused with the wrong DB.
    command: `npx vite --port ${e2ePort} --strictPort`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      ...process.env,
      DATABASE_URL: e2eDatabaseUrl,
      RATE_LIMIT_DISABLED: "true",
      BETTER_AUTH_URL: baseURL,
      BETTER_AUTH_SECRET:
        process.env.BETTER_AUTH_SECRET ??
        "e2e-test-secret-key-at-least-32-chars-long",
      VITE_ENABLE_EMAIL_PASSWORD: "true",
      VITE_ENABLE_MAGIC_LINK: "false",
    },
  },
});
