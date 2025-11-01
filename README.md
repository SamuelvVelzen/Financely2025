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
3. The Prisma Client is automatically regenerated during migration

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
