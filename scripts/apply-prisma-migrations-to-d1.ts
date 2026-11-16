/**
 * Applies Prisma migration SQL files to a Cloudflare D1 database (local or remote).
 *
 * Usage:
 *   yarn db:d1:migrate:local
 *   yarn db:d1:migrate:remote
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const remote = process.argv.includes("--remote");
const databaseName = process.env.D1_DATABASE_NAME ?? "financely";

const migrationsRoot = path.join(process.cwd(), "prisma/migrations");
const migrationDirs = fs
  .readdirSync(migrationsRoot)
  .filter((name) => {
    const full = path.join(migrationsRoot, name);
    return fs.statSync(full).isDirectory();
  })
  .toSorted();

for (const dir of migrationDirs) {
  const sqlPath = path.join(migrationsRoot, dir, "migration.sql");
  if (!fs.existsSync(sqlPath)) {
    continue;
  }

  const flag = remote ? "--remote" : "--local";
  console.log(`[d1] Applying ${dir} (${remote ? "remote" : "local"})…`);
  execSync(
    `wrangler d1 execute ${databaseName} ${flag} --file="${sqlPath}"`,
    { stdio: "inherit" }
  );
}

console.log("[d1] Migrations applied.");