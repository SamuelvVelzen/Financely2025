import path from "node:path";
import { fileURLToPath } from "node:url";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // Vitest bundles its own Vite types; cast avoids duplicate-plugin type conflicts.
  plugins: [tsconfigPaths() as never],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "prisma/**/*.test.ts"],
    setupFiles: [path.join(rootDir, "src/test/setup.ts")],
    globalSetup: [path.join(rootDir, "src/test/global-setup.ts")],
    pool: "forks",
    fileParallelism: false,
    testTimeout: 30_000,
  },
});
