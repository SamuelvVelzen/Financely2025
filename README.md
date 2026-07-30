# Financely

A financial management application built with TanStack Start.

## Tech Stack

- **[TanStack Start](https://tanstack.com/start)** - Full-stack React framework
- **[TanStack Router](https://tanstack.com/router)** - Type-safe routing
- **[TanStack React Query](https://tanstack.com/query)** - Data fetching and state management
- **[React](https://react.dev)** 19 - UI library
- **[TypeScript](https://www.typescriptlang.org)** - Type safety
- **[Vite](https://vitejs.dev)** - Build tool and dev server
- **[Tailwind CSS](https://tailwindcss.com)** - Styling
- **[Prisma](https://www.prisma.io)** - Database ORM

## Getting Started

First, install dependencies:

```bash
yarn install
# or
npm install
```

### Database Setup

This project uses [Prisma](https://www.prisma.io) with SQLite for local development. The database file is stored in `data/dev.db`.

**Note:** SQLite is used for local development only. Production deployments will use a server database (e.g., PostgreSQL). Switching providers only requires changing the `provider` in `prisma/schema.prisma` and re-running migrations.

#### Initial Setup

1. Create the `.env` file (if it doesn't exist) with:

   ```
   DATABASE_URL="file:./data/dev.db"
   ```

2. Generate the Prisma Client:

   ```bash
   yarn prisma:generate
   # or
   npm run prisma:generate
   ```

3. Run migrations to create the database:
   ```bash
   yarn prisma:migrate:dev
   # or
   npm run prisma:migrate:dev
   ```

#### Working with the Database

- **Create a new migration** (after schema changes):

  ```bash
  yarn prisma:migrate:dev --name migration_name
  ```

- **Apply migrations** (in production/CI):

  ```bash
  yarn prisma:migrate
  ```

- **Reset the development database** (drops all data and re-applies migrations):

  ```bash
  yarn db:reset
  # or
  npm run db:reset
  ```

- **Open Prisma Studio** (visual database browser):
  ```bash
  yarn prisma:studio
  # or
  npm run prisma:studio
  ```

#### Using Prisma Client in Code

Import the Prisma client singleton from `@/util/prisma`:

```typescript
import { prisma } from "@/util/prisma";
import type { User, Transaction, Currency } from "@/util/prisma";

// Example: Query transactions
const transactions = await prisma.transaction.findMany({
  where: { userId: "user-id" },
  include: { tags: true },
});

// Use exported types
const currency: Currency = Currency.USD;
```

#### Schema Changes

1. Edit `prisma/schema.prisma`
2. Create a migration: `yarn prisma:migrate:dev --name descriptive_name`
3. The Prisma Client and Zod schemas are automatically regenerated during migration

**Auto-Generated Zod Schemas**: When you run `prisma generate`, Zod schemas are automatically generated from your Prisma schema. The enums (Currency, TransactionType) are imported from the generated schemas, so changes to enum values in Prisma will automatically be reflected in your validation schemas.

- Generated schemas location: `src/lib/validation/generated.ts/`
- Custom API schemas: `src/lib/validation/schemas.ts` (imports enums from generated, applies API-specific transformations)

### Running the Development Server

After setting up the database, run the development server:

```bash
yarn dev
# or
npm run dev
```

The `dev` script automatically generates the Prisma Client before starting.

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing by modifying files in the `src/routes` directory. The page auto-updates as you edit the file.

## Features

### CSV Transaction Import

The application supports importing transactions from CSV files with automatic bank detection. When you upload a CSV file, the system automatically detects the bank based on the filename pattern:

- **ING**: Files matching pattern `NL[digits]INGB[digits]_[date]_[date].csv` (e.g., `NL06INGB0001829429_01-01-2026_03-01-2026.csv`)
- **American Express**: Files starting with `activity` or `activiteit` (e.g., `activity-7.csv`, `activiteit.csv`)

The detected bank is automatically selected, but you can manually change it if needed. See `docs/adding-a-new-bank.md` for information on adding support for additional banks.

### Offline support

Financely is an installable Progressive Web App (PWA). You can add it to your home screen and keep working when your connection drops; queued changes sync when you reconnect.

**Install**

1. Build for production (`npm run build`). Serve over HTTPS (or `localhost`) so the service worker can register.
2. In Chrome/Edge, use the install icon in the address bar, or the in-app **Install Financely** prompt.
3. On iOS Safari: Share → **Add to Home Screen**.

The post-build step `tsx scripts/generate-sw.ts` writes `sw.js` next to the client assets (currently `dist/client/`).
**What works offline**

- **App shell** — A service worker precaches static assets and previously visited pages so a cold start can still boot the UI. Unknown routes fall back to an offline page.
- **Reads** — Successful React Query responses are persisted to IndexedDB (24h), so lists you already loaded can reappear after reload while offline.
- **Writes (create, update, delete)** — JSON API mutations are queued in IndexedDB when you are offline or when a request fails with a network error. Changes replay automatically in order when you reconnect.
- **CSV uploads** — File uploads use the same outbox pattern as other mutations (`apiPostFormData`). Mapping, transform, and import steps that send JSON are also queued.
- **Optimistic UI** — Lists update immediately when you save; the UI rolls back only on a real error (not when a change is queued for sync).
- **Pending sync indicator** — A badge in the app shell shows how many local changes are waiting to sync.
- **Sign-out protection** — Signing out with unsynced changes shows a confirmation so you do not lose work by accident.

**What still requires a connection**

- **Pages you have never opened** — Navigation uses a network-first cache; unvisited server-rendered routes show the offline fallback until you reconnect.
- **Auth flows** — Login, password change, email change, and social account linking go through Better Auth and need the server.
- **CSV wizard steps** — Upload can be queued, but column detection and row parsing need a server round-trip to complete the import flow.

**How it works**

1. `scripts/generate-sw.ts` runs after `vite build` and emits Workbox `sw.js` into the client assets folder (TanStack Start does not yet integrate `vite-plugin-pwa` cleanly).
2. `PwaUpdatePrompt` registers the service worker in production and prompts when an update is waiting.
3. Successful React Query caches are persisted to IndexedDB via a small in-house key/value store (`idb-kv`) so lists survive reload while offline.
4. `useFinMutation` runs with `networkMode: "always"` so mutations are not paused while offline.
5. The API client queues failed or offline writes to the `financely-offline-mutations` IndexedDB store (per signed-in user).
6. `OfflineMutationProcessor` replays the queue FIFO when online, with retries for transient failures.
7. On success, affected React Query caches are invalidated so lists reflect server state.
8. If automatic sync fails, the pending badge stays visible — **tap it to retry manually**.

**Tag + transaction offline:** If you create a tag offline and use it on a transaction, the app links the temporary tag id to the real server id during sync so the transaction replays correctly.

**Requirements**

- You must be **signed in** to queue changes. Unsigned users see an error if they try to save while offline.
- Service workers require a secure context (HTTPS or localhost).

## Learn More

To learn more about the technologies used, take a look at the following resources:

- [TanStack Start Documentation](https://tanstack.com/start) - Learn about TanStack Start features and API
- [TanStack Router Documentation](https://tanstack.com/router) - Learn about type-safe routing
- [TanStack React Query Documentation](https://tanstack.com/query) - Learn about data fetching and caching
- [React Documentation](https://react.dev) - Learn about React

## Build and Deploy

Build the application:

```bash
yarn build
# or
npm run build
```

The `build` script automatically generates the Prisma Client before building.

Start the production server:

```bash
yarn start
# or
npm start
```

### Production Database

For production, you'll need to:

1. Update `prisma/schema.prisma` to change the `provider` from `sqlite` to your target database (e.g., `postgresql`)
2. Update `DATABASE_URL` in your production environment variables
3. Run migrations: `yarn prisma:migrate`

The schema is designed to be provider-agnostic, so switching databases should only require changing the provider configuration.
