import { execSync } from "node:child_process";
import path from "node:path";

export default function globalSetup() {
  const testDbPath = path.join(process.cwd(), "prisma/data/test.db");
  const databaseUrl = `file:${testDbPath}`;

  execSync("npx prisma db push --skip-generate", {
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
    },
    stdio: "inherit",
  });
}
