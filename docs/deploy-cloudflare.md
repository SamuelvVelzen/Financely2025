# Deploy on Cloudflare

Production runs on **Cloudflare** at **https://financely.vanvelzen.dev** (Workers / Pages in the `vanvelzen.dev` zone).

Local development still uses **Node + Nitro** (`yarn dev` / `yarn start`). The same `yarn build` output is what you publish to Cloudflare.

## Prerequisites

- Cloudflare account with the `vanvelzen.dev` zone
- A Workers or Pages project connected to this repository (or manual upload of build artifacts)
- `BETTER_AUTH_SECRET` (32+ random bytes)

## DNS

1. In **DNS** for `vanvelzen.dev`, add or keep a record for the app host, for example:
   - **Name:** `financely`
   - **Target:** your Cloudflare Workers / Pages hostname (or route defined in the dashboard)
   - **Proxy:** proxied (orange cloud) is typical for HTTPS on a custom domain
2. Attach **custom domain** `financely.vanvelzen.dev` on the Workers/Pages project so it matches `BETTER_AUTH_URL`.

Avoid attaching the same hostname to **two** Cloudflare products (for example Pages **and** a Worker route) — that can cause edge errors such as **1102 Worker exceeded CPU time limits** on some requests.

## Environment variables

Set these in the Cloudflare dashboard (**Settings → Variables and secrets**) for the production environment.

| Variable                     | Example                           | Notes                                                                             |
| ---------------------------- | --------------------------------- | --------------------------------------------------------------------------------- |
| `DATABASE_URL`               | `file:…`                          | Prisma SQLite URL pointing at **persistent** storage for your runtime (see below) |
| `NODE_ENV`                   | `production`                      |                                                                                   |
| `BETTER_AUTH_SECRET`         | (secret)                          | Required                                                                          |
| `BETTER_AUTH_URL`            | `https://financely.vanvelzen.dev` | Must match the public URL                                                         |
| `ENABLE_EMAIL_PASSWORD`      | `true`                            |                                                                                   |
| `VITE_ENABLE_EMAIL_PASSWORD` | `true`                            | Client bundle                                                                     |
| `VITE_ENABLE_MAGIC_LINK`     | `false`                           | Recommended until email is configured                                             |
| `ENABLE_MAGIC_LINK`          | `false`                           |                                                                                   |
| `RATE_LIMIT_DISABLED`        | `false`                           |                                                                                   |

**Email (Resend):** optional for now. Leave `RESEND_API_KEY` and `EMAIL_FROM` unset until you add a mail provider. Auth still uses email/password; verification and password-reset **emails** are not sent until Resend is configured (see [Auth without email](#auth-without-email-for-now)).

Copy other flags from [`.env.example`](../.env.example) if you enable OAuth providers.

## Database (SQLite)

The schema targets **SQLite** via Prisma. Production must use a `DATABASE_URL` that survives deploys and restarts on your Cloudflare setup (same idea as the old Railway volume under `/data`).

- Run migrations on deploy: `npx prisma migrate deploy` (or `yarn prisma:migrate`).
- Do **not** run `yarn seed` on every deploy.

### One-shot production seed

Run once with production `DATABASE_URL` and guards from `.env.example`:

```bash
SEED_ALLOW_IN_PRODUCTION=true \
SEED_USER_EMAIL=you@example.com \
SEED_USER_PASSWORD='your-long-password' \
SEED_USER_FIRST_NAME=Sam \
SEED_USER_LAST_NAME=Ney \
NODE_ENV=production \
yarn seed
```

Then remove `SEED_ALLOW_IN_PRODUCTION` from production env so seed cannot run accidentally.

## Build and deploy

```bash
corepack enable
yarn install --immutable
yarn build
```

The repo uses **Yarn 4** (`packageManager` in `package.json`). Cloudflare’s default install must not modify `yarn.lock`; use `--immutable` (or equivalent) in CI.

`yarn build` runs Prisma generate, Vite + Nitro build, and `scripts/generate-sw.ts` for the PWA service worker.

Publish using your Cloudflare project’s workflow (Git integration, `wrangler deploy`, or Pages build command). Set the **build command** to `yarn build:cf` (alias of `yarn build`) or `yarn build`. Run migrations before or as part of the release step.

### Post-deploy checks

- `GET /login` returns **200**
- Sign in with the seeded account (not public registration) until email is configured
- After FX fixes ship: foreign-currency split expense converts (not stuck `pending`)

## Auth without email (for now)

- **Sign in** with the **seeded** user works with email/password.
- **Register** on production is not the supported path until Resend (or another provider) is wired and verification is sorted out.
- Magic link should stay **disabled** in production env until email works.

When you add email later: set `RESEND_API_KEY` and `EMAIL_FROM`, verify the domain in Resend, and re-enable flows that send mail.

## Troubleshooting

| Symptom                                | Things to check                                                                                |
| -------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Cloudflare **1102** (Worker CPU limit) | Worker/Pages routes for `financely.vanvelzen.dev`; duplicate hostname; Workers logs for Ray ID |
| **500** on `/api/auth/sign-up/email`   | Expected without Resend in production; use seed login                                          |
| **401** on API                         | Session cookie; `BETTER_AUTH_URL` must match browser origin                                    |
| FX **pending**                         | Frankfurter API provider must match current API (see vacation fix list)                        |

## Legacy: Railway

[`railway.toml`](../railway.toml) is kept for reference only. Production hosting moved to Cloudflare; do not use Railway docs in the README for new deploys.
