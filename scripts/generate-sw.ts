/**
 * Post-build service worker generation for TanStack Start.
 *
 * vite-plugin-pwa does not reliably emit a SW with Start's multi-environment
 * Vite build, so we generate Workbox output into the client assets folder
 * after `vite build`.
 */
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { generateSW } from "workbox-build";

const candidates = [
  resolve(process.cwd(), "dist/client"),
  resolve(process.cwd(), ".output/public"),
  resolve(process.cwd(), ".tanstack/start/build/client-dist"),
  resolve(process.cwd(), "dist"),
];

const globDirectory = candidates.find((dir) => existsSync(dir));

if (!globDirectory) {
  console.error(
    "[pwa] No client public directory found. Expected one of:\n" +
      candidates.map((c) => `  - ${c}`).join("\n")
  );
  process.exit(1);
}

const swDest = resolve(globDirectory, "sw.js");

const { count, size, warnings } = await generateSW({
  globDirectory,
  globPatterns: [
    "**/*.{js,css,html,svg,png,ico,webmanifest,woff,woff2,webp}",
  ],
  globIgnores: ["**/sw.js", "**/workbox-*.js"],
  swDest,
  // Keep false so the client can confirm before activating (see PwaUpdatePrompt).
  skipWaiting: false,
  clientsClaim: true,
  cleanupOutdatedCaches: true,
  // Do NOT use navigateFallback/App Shell — this app is SSR, not a single-page shell.
  runtimeCaching: [
    {
      urlPattern: ({ request }) => request.mode === "navigate",
      handler: "NetworkFirst",
      options: {
        cacheName: "financely-pages",
        networkTimeoutSeconds: 4,
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 7 * 24 * 60 * 60,
        },
        plugins: [
          {
            handlerDidError: async () => {
              return (
                (await caches.match("/offline.html", { ignoreSearch: true })) ??
                Response.error()
              );
            },
          },
        ],
      },
    },
    {
      urlPattern: ({ url }) =>
        url.pathname.startsWith("/api/") ||
        url.pathname.startsWith("/_serverFn/"),
      handler: "NetworkOnly",
    },
    {
      urlPattern: ({ request, url }) =>
        request.destination === "script" ||
        request.destination === "style" ||
        request.destination === "worker" ||
        /\.(?:js|css|woff2?)$/i.test(url.pathname),
      handler: "CacheFirst",
      options: {
        cacheName: "financely-static",
        expiration: {
          maxEntries: 120,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        },
      },
    },
    {
      urlPattern: ({ request }) =>
        request.destination === "image" || request.destination === "font",
      handler: "CacheFirst",
      options: {
        cacheName: "financely-media",
        expiration: {
          maxEntries: 80,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        },
      },
    },
  ],
});

if (warnings.length > 0) {
  console.warn("[pwa] Workbox warnings:");
  for (const warning of warnings) {
    console.warn(`  - ${warning}`);
  }
}

console.log(
  `[pwa] Generated ${swDest} — precached ${count} files (${(size / 1024).toFixed(1)} KiB)`
);
