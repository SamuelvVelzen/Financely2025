/**
 * Local production runner for TanStack Start (fetch handler + static client).
 * Usage: node scripts/serve-prod.mjs
 */
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const clientDir = resolve(root, "dist/client");
const serverEntry = resolve(root, "dist/server/server.js");
const port = Number(process.env.PORT) || 3000;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".map": "application/json",
  ".csv": "text/csv; charset=utf-8",
};

const { default: start } = await import(pathToFileURL(serverEntry).href);

function isSafeClientPath(pathname) {
  const decoded = decodeURIComponent(pathname);
  const full = normalize(join(clientDir, decoded));
  return full.startsWith(clientDir) && existsSync(full) && statSync(full).isFile();
}

function serveStatic(req, res, pathname) {
  const full = normalize(join(clientDir, decodeURIComponent(pathname)));
  const type = mimeTypes[extname(full)] ?? "application/octet-stream";
  res.writeHead(200, {
    "Content-Type": type,
    "Cache-Control":
      pathname === "/sw.js"
        ? "no-cache"
        : "public, max-age=31536000, immutable",
  });
  createReadStream(full).pipe(res);
}

const server = createServer(async (req, res) => {
  try {
    const host = req.headers.host ?? `localhost:${port}`;
    const url = new URL(req.url ?? "/", `http://${host}`);
    const pathname = url.pathname === "/" ? "/index.html" : url.pathname;

    // Prefer static assets (SW, manifest, hashed JS/CSS, icons) when present.
    if (pathname !== "/index.html" && isSafeClientPath(pathname)) {
      serveStatic(req, res, pathname);
      return;
    }

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value == null) continue;
      if (Array.isArray(value)) {
        for (const item of value) headers.append(key, item);
      } else {
        headers.set(key, value);
      }
    }

    const body =
      req.method === "GET" || req.method === "HEAD"
        ? undefined
        : await new Promise((resolveBody, reject) => {
            const chunks = [];
            req.on("data", (chunk) => chunks.push(chunk));
            req.on("end", () => resolveBody(Buffer.concat(chunks)));
            req.on("error", reject);
          });

    const request = new Request(url, {
      method: req.method,
      headers,
      body,
      duplex: body ? "half" : undefined,
    });

    const response = await start.fetch(request);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    if (req.method === "HEAD" || !response.body) {
      res.end();
      return;
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    res.end(buffer);
  } catch (error) {
    console.error("[serve-prod]", error);
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Internal Server Error");
  }
});

server.listen(port, () => {
  console.log(`[serve-prod] http://localhost:${port}`);
  console.log(`[serve-prod] static: ${clientDir}`);
  console.log(`[serve-prod] handler: ${serverEntry}`);
});
