import path from "node:path";
import { fileURLToPath } from "node:url";
import viteReact from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [viteReact() as never, tsconfigPaths() as never],
  test: {
    globals: false,
    pool: "forks",
    fileParallelism: false,
    testTimeout: 30_000,
    globalSetup: [path.join(rootDir, "src/test/global-setup.ts")],
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: ["src/**/*.test.ts", "prisma/**/*.test.ts"],
          setupFiles: [path.join(rootDir, "src/test/setup.ts")],
        },
      },
      {
        extends: true,
        test: {
          name: "component",
          environment: "jsdom",
          include: ["src/**/*.test.tsx"],
          setupFiles: [
            path.join(rootDir, "src/test/setup.ts"),
            path.join(rootDir, "src/test/component-setup.ts"),
          ],
        },
      },
    ],
  },
});
