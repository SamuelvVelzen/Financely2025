import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { setTimeout } from "node:timers/promises";

async function unlinkIfPresent(file: string) {
  if (!fs.existsSync(file)) {
    return;
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      fs.unlinkSync(file);
      return;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === "EBUSY" && attempt < 4) {
        await setTimeout(100 * (attempt + 1));
        continue;
      }
      if (code === "EBUSY") {
        return;
      }
      throw error;
    }
  }
}

export default async function globalSetup() {
  const testDbPath = path.join(process.cwd(), "prisma/data/test.db");
  const databaseUrl = `file:${testDbPath}`;

  fs.mkdirSync(path.dirname(testDbPath), { recursive: true });
  for (const suffix of ["", "-journal", "-wal", "-shm"]) {
    await unlinkIfPresent(`${testDbPath}${suffix}`);
  }

  execSync("npx prisma db push --skip-generate", {
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
    },
    stdio: "inherit",
  });
}
