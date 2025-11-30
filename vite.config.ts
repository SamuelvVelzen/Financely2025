// vite.config.ts
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    // TanStack Start should come before React plugin
    tanstackStart(),
    viteReact(),
    tailwindcss(),
    // Enables Vite to resolve imports using path aliases.
    tsconfigPaths(),
  ],
  optimizeDeps: {
    exclude: [
      "#tanstack-router-entry",
      "#tanstack-start-entry",
      "tanstack-start-manifest:v",
      "tanstack-start-injected-head-scripts:v",
    ],
  },
});
