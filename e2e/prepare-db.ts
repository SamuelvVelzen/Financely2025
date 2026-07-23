import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";

config({ path: ".env" });

export const E2E_DB_PATH = path.join(process.cwd(), "prisma/data/e2e.db");
export const E2E_DATABASE_URL = `file:${E2E_DB_PATH}`;

export function resolveE2eCredentials() {
  return {
    email: (
      process.env.SEED_USER_EMAIL?.trim() || "e2e@financely.local"
    ).toLowerCase(),
    password: process.env.SEED_USER_PASSWORD?.trim() || "e2e-password-123",
  };
}

export async function prepareE2eDatabase() {
  const { email, password } = resolveE2eCredentials();

  fs.mkdirSync(path.dirname(E2E_DB_PATH), { recursive: true });
  for (const suffix of ["", "-journal", "-wal", "-shm"]) {
    const filePath = `${E2E_DB_PATH}${suffix}`;
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  const env = {
    ...process.env,
    DATABASE_URL: E2E_DATABASE_URL,
    RATE_LIMIT_DISABLED: "true",
    SEED_USER_EMAIL: email,
    SEED_USER_PASSWORD: password,
    NODE_ENV: "development",
  };

  execSync("npx prisma db push --skip-generate", {
    env,
    stdio: "inherit",
  });

  execSync("npx tsx prisma/seed.ts", {
    env,
    stdio: "inherit",
  });

  const prisma = new PrismaClient({
    datasources: { db: { url: E2E_DATABASE_URL } },
  });

  try {
    const userInfo = await prisma.userInfo.findUnique({
      where: { email },
      include: { user: true },
    });
    const userId = userInfo?.user?.id;
    if (!userId) {
      throw new Error(`E2E seed user not found for ${email}`);
    }

    await prisma.wizardProgress.upsert({
      where: {
        userId_wizardId: {
          userId,
          wizardId: "onboarding",
        },
      },
      create: {
        userId,
        wizardId: "onboarding",
        currentStepIndex: 0,
        totalSteps: 1,
        completed: true,
        completedAt: new Date(),
      },
      update: {
        completed: true,
        completedAt: new Date(),
      },
    });
  } finally {
    await prisma.$disconnect();
  }

  process.env.DATABASE_URL = E2E_DATABASE_URL;
  process.env.SEED_USER_EMAIL = email;
  process.env.SEED_USER_PASSWORD = password;
}
