# Deploy on Cloudflare Workers + D1

Production runs on **Cloudflare Workers** at **https://financely.vanvelzen.dev**, with **D1** (SQLite) as the database.

Local `yarn dev` uses the same stack: Vite + `@cloudflare/vite-plugin`, Wrangler local D1, and the custom worker entry in `src/server.ts`.

## Prerequisites

- Cloudflare account with the `vanvelzen.dev` zone
- Wrangler logged in (`wrangler login`)
- D1 database created and bound as `DB` in `wrangler.jsonc`
- `BETTER_AUTH_SECRET` (32+ random bytes) set as a Worker **secret**

## One-time D1 setup

1. Create the database (if you have not already):

   ```bash
   wrangler d1 create financely
   ```

2. Copy the `database_id` from the command output into `wrangler.jsonc` under `d1_databases[0].database_id` (replace the placeholder).

3. Apply schema to **remote** D1 (run after every release that includes new Prisma migrations):

   ```bash
   yarn db:d1:migrate:remote
   ```

4. For local dev / preview against local D1:

   ```bash
   yarn db:d1:migrate:local
   ```

Prisma migrations live under `prisma/migrations/`; the `db:d1:migrate:*` scripts execute each `migration.sql` in order via `wrangler d1 execute`.

## DNS and custom domain

1. In **DNS** for `vanvelzen.dev`, point `financely` at your Worker (or attach the hostname in the Worker dashboard).
2. Set **`BETTER_AUTH_URL`** to `https://financely.vanvelzen.dev`.

Avoid attaching the same hostname to two Cloudflare products (Pages and a Worker route), which can cause edge errors.

## Environment variables

Set these on the Worker (**Settings → Variables and secrets**) for production.

| Variable                     | Example                           | Notes                                      |
| ---------------------------- | --------------------------------- | ------------------------------------------ |
| `NODE_ENV`                   | `production`                      |                                            |
| `BETTER_AUTH_SECRET`         | (secret)                          | Required                                   |
| `BETTER_AUTH_URL`            | `https://financely.vanvelzen.dev` | Must match the public URL                  |
| `ENABLE_EMAIL_PASSWORD`      | `true`                            |                                            |
| `VITE_ENABLE_EMAIL_PASSWORD` | `true`                            | Client bundle (build-time on CI if needed) |
| `VITE_ENABLE_MAGIC_LINK`     | `false`                           |                                            |
| `ENABLE_MAGIC_LINK`          | `false`                           |                                            |
| `RATE_LIMIT_DISABLED`        | `false`                           |                                            |

You do **not** set `DATABASE_URL` in production; Prisma uses the **`DB`** D1 binding via `@prisma/adapter-d1`.

Copy other flags from [`.env.example`](../.env.example) if you enable OAuth providers.

## One-shot production seed

After migrations, seed once against remote D1. Use a machine with Wrangler access and production secrets, or run seed logic via a controlled admin path documented in your runbook.

Guards from `.env.example` still apply (`SEED_ALLOW_IN_PRODUCTION`, etc.). Do not run `yarn seed` on every deploy.

## Build and deploy

```bash
corepack enable
yarn install --immutable
yarn build:cf
yarn deploy
```

Or:

```bash
yarn deploy
```

Cloudflare CI should use **`yarn build:cf`** (Prisma generate, Vite Worker build, PWA `sw.js`) and deploy the Wrangler output.

After deploy, run **`yarn db:d1:migrate:remote`** if this release added migrations.

### Post-deploy checks

- `GET /login` returns **200**
- Sign in with the seeded account
- Workers logs show no Prisma / D1 errors on first request

## Local development

```bash
cp .env.example .env
yarn db:d1:migrate:local
yarn dev
```

Vitest still uses file SQLite (`DATABASE_URL` in test global setup), not D1.

## Auth without email (for now)

- Sign in with the **seeded** user works with email/password.
- **Register** on production is not the supported path until Resend (or another provider) is wired.
- Keep magic link **disabled** in production until email works.

## Troubleshooting

| Symptom               | Things to check                                                            |
| --------------------- | -------------------------------------------------------------------------- |
| **500** on all routes | D1 binding `DB`; migrations applied; `BETTER_AUTH_SECRET` set; Worker logs |
| **500** on auth       | Prisma D1 adapter; schema applied to D1; cookie / `BETTER_AUTH_URL` origin |
| Build fails           | Yarn 4 `--immutable`; `yarn prisma:generate` before build                  |
| **1102** CPU limit    | Duplicate hostname / route; heavy work on edge                             |

## Legacy: Railway / Nitro

[`railway.toml`](../railway.toml) and the old Nitro `node .output/server/index.mjs` flow are obsolete for production. The app targets **TanStack Start + Cloudflare Vite plugin + Wrangler**, not `nitro()` node-server.
